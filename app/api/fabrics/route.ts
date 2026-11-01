import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { cleanSearch, getDepartment } from '@/lib/fabric/catalog'
import { getFabricNeed } from '@/lib/fabric/needs'
import { cacheControlFor, searchAllSources } from '@/lib/fabric/sources'
import type { FabricListing, FabricSearchResponse, SourceStatus } from '@/lib/fabric/types'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { errorMessage, logEvent, withRequestId } from '@/lib/server/log'

// Each search calls every shop, so one visitor gets 30 a minute (the store makes a few per page)
const LIMIT = 30
const WINDOW_MS = 60_000

const slug = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)
/** Each search is cached by its URL, so anything that isn't a real search is turned away before it costs anything */
const paramsSchema = z.object({
  garment: slug.optional(),
  choice: slug.optional(),
  department: slug.optional(),
  q: z.string().max(200).optional(),
})

/**
 * Searches every fabric source.
 *   ?garment=lace-waist-skirt                      every recommended fabric for a garment, with `matches`
 *   ?garment=lace-waist-skirt&choice=viscose  just one of them
 *   ?department=linen                              a store department
 *   ?q=washed linen                                the store's search box
 *   (nothing)                                      browse the latest fabric in every shop
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(`fabrics:${clientIp(request.headers)}`, LIMIT, WINDOW_MS)
  if (!limited.ok) {
    return Response.json(
      { error: 'Too many searches. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfter), 'Cache-Control': 'no-store' } },
    )
  }

  const parsed = paramsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return Response.json({ error: 'That search could not be read.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
  const params = parsed.data

  const requestId = request.headers.get('x-vercel-id') ?? crypto.randomUUID()
  return withRequestId(requestId, async () => {
    const started = Date.now()
    try {
      const result = await search(params)
      const failed = result.sources.filter((s) => s.failed).map((s) => s.id)
      const incomplete = result.sources.filter((s) => s.incomplete).map((s) => s.id)
      logEvent(failed.length + incomplete.length > 0 ? 'warn' : 'info', 'fabric.search', { durationMs: Date.now() - started, listings: result.listings.length, failed, incomplete })
      return Response.json(result, { headers: { 'Cache-Control': cacheControlFor(result.sources) } })
    } catch (error) {
      logEvent('error', 'fabric.search', { durationMs: Date.now() - started, reason: 'unexpected', error: errorMessage(error) })
      return Response.json({ error: 'The search failed. Try again in a moment.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }
  })
}

function search(params: z.infer<typeof paramsSchema>): Promise<FabricSearchResponse> {
  if (params.garment) {
    const need = getFabricNeed(params.garment)
    const picked = need.choices.find((c) => c.id === params.choice)
    return searchRecommended(picked ? [picked] : need.choices)
  }
  const department = getDepartment(params.department)
  if (department) return searchAllSources({ q: department.query, match: department.match, limit: 8, kind: department.kind })
  const q = cleanSearch(params.q)
  if (q.length >= 2) {
    const words = q.toLowerCase().split(' ').filter((w) => w.length > 2)
    return searchAllSources({ q, match: words.length ? words : [q.toLowerCase()], limit: 8, kind: 'fabric' })
  }
  return searchAllSources(null)
}

/**
 * Searches each recommended fabric at once and merges them: the lists take turns so every
 * fabric shows on the first screen, a listing that suits two of them shows once, and
 * `matches` says which fabrics each listing suits so the page can filter without asking again.
 */
async function searchRecommended(choices: { id: string; query: string; match: string[] }[]): Promise<FabricSearchResponse> {
  const results = await Promise.all(
    choices.map((c) => searchAllSources({ q: c.query, match: c.match, limit: 6, kind: 'fabric' })),
  )
  const listings: FabricListing[] = []
  const matches: Record<string, string[]> = {}
  for (let i = 0; results.some((r) => i < r.listings.length); i++) {
    results.forEach((r, n) => {
      const l = r.listings[i]
      if (!l) return
      if (!matches[l.id]) {
        matches[l.id] = []
        listings.push(l)
      }
      if (!matches[l.id].includes(choices[n].id)) matches[l.id].push(choices[n].id)
    })
  }
  // One status per shop: it answered if it answered any of the searches
  const sources = new Map<string, SourceStatus>()
  for (const s of results.flatMap((r) => r.sources)) {
    const seen = sources.get(s.id)
    // `failed` stays set if any search failed, so the merged answer isn't cached as if it were complete
    sources.set(s.id, seen ? { ...seen, ok: seen.ok || s.ok, failed: seen.failed || s.failed, incomplete: seen.incomplete || s.incomplete, count: seen.count + s.count, note: seen.ok || s.ok ? undefined : seen.note } : s)
  }
  return { listings, sources: [...sources.values()], matches }
}
