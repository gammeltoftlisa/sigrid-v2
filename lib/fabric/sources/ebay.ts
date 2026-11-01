import { fetchJson, UpstreamError } from '@/lib/server/fetch-with-retry'

import type { FabricListing, FabricQuery } from '../types'
import { parsePieceMeters } from './piece-length'
import { ebayItem, ebaySearchResponse, ebayToken, parseEach } from './schemas'

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
/** A garment search runs several queries at once; they share one token request */
let pendingToken: Promise<string> | null = null

async function requestToken(deadlineAt: number): Promise<string> {
  const basic = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64')
  const data = await fetchJson(
    'https://api.ebay.com/identity/v1/oauth2/token',
    {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' }),
      cache: 'no-store',
    },
    ebayToken,
    // Asking again just gives another token
    { op: 'fabric.ebay.token', source: 'ebay', deadlineAt, safeToRetry: true },
  )
  token = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 }
  return token.value
}

function getToken(deadlineAt: number): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return Promise.resolve(token.value)
  pendingToken ??= requestToken(deadlineAt).finally(() => {
    pendingToken = null
  })
  return pendingToken
}

async function search(query: FabricQuery, deadlineAt: number) {
  const params = new URLSearchParams({
    q: `${query.q} fabric`,
    filter: 'conditions:{USED},buyingOptions:{FIXED_PRICE}',
    limit: String(query.limit * 2),
  })
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await getToken(deadlineAt)}`,
    'X-EBAY-C-MARKETPLACE-ID': process.env.EBAY_MARKETPLACE ?? 'EBAY_GB',
  }
  if (process.env.EBAY_CAMPAIGN_ID) headers['X-EBAY-C-ENDUSERCTX'] = `affiliateCampaignId=${process.env.EBAY_CAMPAIGN_ID}`

  return fetchJson(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, { headers, next: { revalidate: 60 * 30 } }, ebaySearchResponse, {
    op: 'fabric.ebay.search',
    source: 'ebay',
    deadlineAt,
  })
}

export async function searchEbay(query: FabricQuery, deadlineAt: number): Promise<FabricListing[]> {
  const data = await search(query, deadlineAt).catch((e) => {
    // eBay can end a token before its stated expiry: get a new one and ask once more
    if (!(e instanceof UpstreamError) || e.status !== 401) throw e
    token = null
    return search(query, deadlineAt)
  })
  const terms = query.match.map((t) => t.toLowerCase())

  return parseEach(data.itemSummaries ?? [], ebayItem, 'fabric.ebay.items', 'ebay')
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
