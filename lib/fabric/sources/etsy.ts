import type { FabricListing, FabricQuery } from '../types'
import { withReferral } from './referral'
import { parsePieceMeters } from './piece-length'

/**
 * Vintage fabric on Etsy, through the Open API v3.
 * Needs ETSY_API_KEY: the app's keystring, or "keystring:shared_secret" as Etsy now asks for.
 * Only listings Etsy marks as made before 2010 are kept, so results are genuinely secondhand.
 */
export const etsySource = {
  id: 'etsy',
  name: 'Etsy vintage',
  configured: () => !!process.env.ETSY_API_KEY,
}

interface EtsyListing {
  listing_id: number
  title: string
  url: string
  when_made?: string
  price: { amount: number; divisor: number; currency_code: string }
  images?: { url_570xN: string }[]
  shipping_profile?: { origin_country_iso?: string }
}

const VINTAGE = /^(before_|19\d0s|19\d\d_|200\d|2000_)/

export async function searchEtsy(query: FabricQuery): Promise<FabricListing[]> {
  const headers = { 'x-api-key': process.env.ETSY_API_KEY! }
  const params = new URLSearchParams({ keywords: `vintage ${query.q} fabric`, limit: '40', sort_on: 'score' })
  const res = await fetch(`https://openapi.etsy.com/v3/application/listings/active?${params}`, {
    headers,
    next: { revalidate: 60 * 30 },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as { results: EtsyListing[] }
  const terms = query.match.map((t) => t.toLowerCase())
  const picked = data.results
    .filter((l) => l.when_made && VINTAGE.test(l.when_made))
    .filter((l) => terms.some((t) => l.title.toLowerCase().includes(t)))
    .slice(0, query.limit)
  if (picked.length === 0) return []

  // The search response has no images; fetch them in one batch call
  const batch = await fetch(
    `https://openapi.etsy.com/v3/application/listings/batch?listing_ids=${picked.map((l) => l.listing_id).join(',')}&includes=Images,Shipping`,
    { headers, next: { revalidate: 60 * 30 }, signal: AbortSignal.timeout(8000) },
  )
  const detailed = batch.ok ? ((await batch.json()) as { results: EtsyListing[] }).results : picked
  const byId = new Map(detailed.map((l) => [l.listing_id, l]))

  return picked.map((l) => {
    const d = byId.get(l.listing_id) ?? l
    return {
      id: `etsy:${l.listing_id}`,
      kind: 'fabric' as const,
      sourceId: 'etsy',
      sourceName: 'Etsy vintage',
      title: decode(l.title),
      url: withReferral(l.url),
      image: d.images?.[0]?.url_570xN,
      condition: 'secondhand' as const,
      currency: l.price.currency_code,
      unitPrice: l.price.amount / l.price.divisor,
      unitMeters: null,
      pieceMeters: parsePieceMeters(l.title),
      shipsFrom: d.shipping_profile?.origin_country_iso ?? '',
      available: true,
      checkout: { kind: 'link' as const },
    }
  })
}

const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
