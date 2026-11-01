import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { cleanSearch } from '@/lib/fabric/catalog'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { errorMessage, logEvent } from '@/lib/server/log'
import { queryShop, queryShopRows } from '@/lib/shop/query'
import { getCatalogue } from '@/lib/shop/store'
import { facetLabels, getCategory, type FacetId } from '@/lib/shop/taxonomy'
import type { ShopQuery } from '@/lib/shop/types'

// Each filter you change is one request, and they're answered from memory
const LIMIT = 180
const WINDOW_MS = 60_000

const FACET_IDS = Object.keys(facetLabels) as FacetId[]
const scalars = z.object({
  category: z.string().max(40).optional(),
  sub: z.string().max(60).optional(),
  q: z.string().max(200).optional(),
  sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc']).catch('featured'),
  page: z.coerce.number().int().min(1).max(500).catch(1),
  price: z.string().regex(/^\d{1,5}-\d{1,5}$/).optional().catch(undefined),
})

/** The store: ?category=thread&sub=Topstitch&colour=Blue&colour=Red&price=2-10&sort=price-asc&page=2, or ?view=rows for the way in */
export async function GET(request: NextRequest) {
  const limited = rateLimit(`shop:${clientIp(request.headers)}`, LIMIT, WINDOW_MS)
  if (!limited.ok) {
    return Response.json({ error: 'Too many searches. Try again in a minute.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfter), 'Cache-Control': 'no-store' } })
  }

  const params = request.nextUrl.searchParams
  const parsed = scalars.safeParse(Object.fromEntries(params))
  if (!parsed.success) return Response.json({ error: 'That search could not be read.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  const { category, sub, q, sort, page, price } = parsed.data

  const filters: ShopQuery['filters'] = {}
  for (const id of FACET_IDS) {
    const values = params.getAll(id).filter((v) => v.length > 0 && v.length <= 60).slice(0, 30)
    if (values.length) filters[id] = values
  }
  const [min, max] = price?.split('-').map(Number) ?? []
  const query: ShopQuery = {
    category: getCategory(category)?.id,
    sub,
    q: cleanSearch(q) || undefined,
    filters,
    price: price ? { min: Math.min(min, max), max: Math.max(min, max) } : undefined,
    sort,
    page,
  }

  try {
    const { items, refreshedAt } = await getCatalogue()
    return Response.json(params.get('view') === 'rows' ? queryShopRows(items, refreshedAt) : queryShop(items, query, refreshedAt), { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } })
  } catch (error) {
    logEvent('error', 'shop.query', { error: errorMessage(error) })
    return Response.json({ error: 'The shop couldn’t be read. Try again in a moment.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
