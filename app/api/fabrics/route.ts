import type { NextRequest } from 'next/server'

import { cleanSearch, getDepartment } from '@/lib/fabric/catalog'
import { getFabricNeed } from '@/lib/fabric/needs'
import { searchAllSources } from '@/lib/fabric/sources'
import type { FabricQuery } from '@/lib/fabric/types'
import { clientIp, rateLimit } from '@/lib/rate-limit'

// Each search calls every shop, so one visitor gets 30 a minute (the store makes a few per page)
const LIMIT = 30
const WINDOW_MS = 60_000

/**
 * Searches every fabric source.
 *   ?garment=classic-tshirt&choice=cotton-jersey  one of a garment's recommended fabrics
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
    const choice = need.choices.find((c) => c.id === params.get('choice')) ?? need.choices[0]
    query = { q: choice.query, match: choice.match, limit: 6, kind: 'fabric' }
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
