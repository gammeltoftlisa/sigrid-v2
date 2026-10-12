import type { FabricListing, FabricQuery } from '../types'
import { parsePieceMeters } from './piece-length'

/**
 * Used fabric on eBay, through the Buy › Browse API.
 * Needs EBAY_CLIENT_ID and EBAY_CLIENT_SECRET (an eBay developer "production" keyset).
 * EBAY_MARKETPLACE picks the site (default EBAY_GB); EBAY_CAMPAIGN_ID turns on
 * eBay Partner Network attribution so referred purchases earn commission.
 */
export const ebaySource = {
  id: 'ebay',
  name: 'eBay',
  configured: () => !!process.env.EBAY_CLIENT_ID && !!process.env.EBAY_CLIENT_SECRET,
}

let token: { value: string; expires: number } | null = null

async function getToken(): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value
  const basic = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' }),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`token HTTP ${res.status}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  token = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 }
  return token.value
}

interface ItemSummary {
  itemId: string
  title: string
  price?: { value: string; currency: string }
  image?: { imageUrl: string }
  itemWebUrl: string
  itemAffiliateWebUrl?: string
  itemLocation?: { country?: string }
}

export async function searchEbay(query: FabricQuery): Promise<FabricListing[]> {
  const params = new URLSearchParams({
    q: `${query.q} fabric`,
    filter: 'conditions:{USED},buyingOptions:{FIXED_PRICE}',
    limit: String(query.limit * 2),
  })
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await getToken()}`,
    'X-EBAY-C-MARKETPLACE-ID': process.env.EBAY_MARKETPLACE ?? 'EBAY_GB',
  }
  if (process.env.EBAY_CAMPAIGN_ID) headers['X-EBAY-C-ENDUSERCTX'] = `affiliateCampaignId=${process.env.EBAY_CAMPAIGN_ID}`

  const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
    headers,
    next: { revalidate: 60 * 30 },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as { itemSummaries?: ItemSummary[] }
  const terms = query.match.map((t) => t.toLowerCase())

  return (data.itemSummaries ?? [])
    .filter((i) => i.price && terms.some((t) => i.title.toLowerCase().includes(t)))
    .slice(0, query.limit)
    .map((i) => ({
      id: `ebay:${i.itemId}`,
      kind: 'fabric' as const,
      sourceId: 'ebay',
      sourceName: 'eBay',
      title: i.title,
      url: i.itemAffiliateWebUrl ?? i.itemWebUrl,
      image: i.image?.imageUrl,
      condition: 'secondhand',
      currency: i.price!.currency,
      unitPrice: Number(i.price!.value),
      unitMeters: null,
      pieceMeters: parsePieceMeters(i.title),
      shipsFrom: i.itemLocation?.country ?? '',
      available: true,
      checkout: { kind: 'link' },
    }))
}
