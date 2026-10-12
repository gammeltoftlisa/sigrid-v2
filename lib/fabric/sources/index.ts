import { safeListing } from '../safe-listing'
import type { FabricListing, FabricQuery, FabricSearchResponse, SourceKind, SourceStatus } from '../types'
import { ebaySource, searchEbay } from './ebay'
import { etsySource, searchEtsy } from './etsy'
import { browseShopify, searchShopify, shopifyShops } from './shopify'

/**
 * Every place Sigrid can buy fabric from. To add a shop or marketplace, write an
 * adapter that returns `FabricListing[]` and register it here.
 */
interface Source {
  id: string
  name: string
  kind: SourceKind
  /** Null when the source can be searched; otherwise why it is skipped */
  unavailable: () => string | null
  search: (q: FabricQuery) => Promise<FabricListing[]>
  /** Whole-store browsing without a search; sources without it sit out */
  browse?: (limit: number) => Promise<FabricListing[]>
  /** Secondhand sources only carry fabric, not notions */
  fabricOnly?: boolean
}

const sources: Source[] = [
  ...shopifyShops.map<Source>((shop) => ({
    id: shop.id,
    name: shop.name,
    kind: shop.condition === 'deadstock' ? 'deadstock' : 'shop',
    unavailable: () => null,
    search: (q) => searchShopify(shop, q),
    browse: (limit) => browseShopify(shop, limit),
  })),
  {
    ...ebaySource,
    kind: 'secondhand',
    unavailable: () => (ebaySource.configured() ? null : 'Needs eBay API keys'),
    search: searchEbay,
    fabricOnly: true,
  },
  {
    ...etsySource,
    kind: 'secondhand',
    unavailable: () => (etsySource.configured() ? null : 'Needs an Etsy API key'),
    search: searchEtsy,
    fabricOnly: true,
  },
]

/** Search every source for one query, or browse every store when `query` is null */
export async function searchAllSources(query: FabricQuery | null, browseLimit = 8): Promise<FabricSearchResponse> {
  const settled = await Promise.all(
    sources.map(async (s): Promise<{ status: SourceStatus; listings: FabricListing[] } | null> => {
      if (query?.kind === 'notion' && s.fabricOnly) return null
      if (!query && !s.browse) return null
      const base = { id: s.id, name: s.name, kind: s.kind }
      const skip = s.unavailable()
      if (skip) return { status: { ...base, ok: false, count: 0, note: skip }, listings: [] }
      try {
        const raw = query ? await s.search(query) : await s.browse!(browseLimit)
        const listings = raw.map(safeListing).filter((l): l is FabricListing => l !== null)
        return { status: { ...base, ok: true, count: listings.length }, listings }
      } catch (e) {
        console.warn(`[fabric] ${s.id} failed:`, e instanceof Error ? e.message : e)
        return { status: { ...base, ok: false, count: 0, note: 'Didn’t answer in time' }, listings: [] }
      }
    }),
  )
  const answered = settled.filter((r) => r !== null)

  // Take turns between sources so no single shop fills the first screen
  const lists = answered.map((r) => r.listings)
  const listings: FabricListing[] = []
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (l[i]) listings.push(l[i])

  return { listings, sources: answered.map((r) => r.status) }
}
