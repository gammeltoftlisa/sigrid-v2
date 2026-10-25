import type { NextRequest } from 'next/server'

import { cleanSearch, getDepartment } from '@/lib/fabric/catalog'
import { getFabricNeed } from '@/lib/fabric/needs'
import { searchAllSources } from '@/lib/fabric/sources'
import type { FabricListing, FabricQuery, FabricSearchResponse, SourceStatus } from '@/lib/fabric/types'
import { clientIp, rateLimit } from '@/lib/rate-limit'

// Each search calls every shop, so one visitor gets 30 a minute (the store makes a few per page)
const LIMIT = 30
const WINDOW_MS = 60_000

/**
 * Searches every fabric source.
 *   ?garment=classic-tshirt                       every recommended fabric for a garment, with `matches`
 *   ?garment=classic-tshirt&choice=cotton-jersey  just one of them
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

  const params = request.nextUrl.searchParams
  let query: FabricQuery | null = null

  const garmentId = params.get('garment')
  const department = getDepartment(params.get('department'))
  const q = cleanSearch(params.get('q'))

  if (garmentId) {
    const need = getFabricNeed(garmentId)
    const picked = need.choices.find((c) => c.id === params.get('choice'))
    const result = await searchRecommended(picked ? [picked] : need.choices)
    return Response.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } else if (department) {
    query = { q: department.query, match: department.match, limit: 8, kind: department.kind }
  } else if (q.length >= 2) {
    const words = q.toLowerCase().split(' ').filter((w) => w.length > 2)
    query = { q, match: words.length ? words : [q.toLowerCase()], limit: 8, kind: 'fabric' }
  }

  const result = await searchAllSources(query)
  return Response.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
  })
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
    sources.set(s.id, seen ? { ...seen, ok: seen.ok || s.ok, count: seen.count + s.count, note: seen.ok || s.ok ? undefined : seen.note } : s)
  }
  return { listings, sources: [...sources.values()], matches }
}
