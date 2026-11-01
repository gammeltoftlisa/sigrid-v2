import { failureOf, UpstreamError } from '@/lib/server/fetch-with-retry'
import { logEvent } from '@/lib/server/log'

import { safeListing } from '../safe-listing'
import type { FabricListing, FabricQuery, FabricSearchResponse, SourceKind, SourceStatus } from '../types'
import { ebaySource, searchEbay } from './ebay'
import { etsySource, searchEtsy } from './etsy'
import { searchShopify, shopifyShops, type ShopAnswer } from './shopify'

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
  search: (q: FabricQuery, deadlineAt: number) => Promise<ShopAnswer>
  /** Secondhand sources only carry fabric, not notions */
  fabricOnly?: boolean
}

const sources: Source[] = [
  ...shopifyShops.map<Source>((shop) => ({
    id: shop.id,
    name: shop.name,
    kind: shop.condition === 'deadstock' ? 'deadstock' : 'shop',
    unavailable: () => null,
    search: (q, deadlineAt) => searchShopify(shop, q, deadlineAt),
  })),
  {
    ...ebaySource,
    kind: 'secondhand',
    unavailable: () => (ebaySource.configured() ? null : 'Needs eBay API keys'),
    search: async (q, deadlineAt) => ({ listings: await searchEbay(q, deadlineAt) }),
    fabricOnly: true,
  },
  {
    ...etsySource,
    kind: 'secondhand',
    unavailable: () => (etsySource.configured() ? null : 'Needs an Etsy API key'),
    search: async (q, deadlineAt) => ({ listings: await searchEtsy(q, deadlineAt) }),
    fabricOnly: true,
  },
]

/** How long one source gets, retries included. The search answers with whoever made it in time. */
const SOURCE_DEADLINE_MS = 10_000

/** What the visitor is told when a source fails: only say it was slow if it really was */
function noteFor(error: unknown): string {
  const slow = error instanceof UpstreamError && (error.reason === 'timeout' || error.reason === 'deadline')
  return slow ? 'Didn’t answer in time' : 'Couldn’t be reached'
}

/**
 * How long the CDN may keep a search. A full answer keeps for half an hour. A partial one keeps only
 * briefly, and when nobody answered it isn't kept at all, so one bad moment doesn't stay for everyone.
 */
export function cacheControlFor(sources: SourceStatus[]): string {
  if (!sources.some((s) => s.failed || s.incomplete)) return 'public, s-maxage=1800, stale-while-revalidate=3600'
  const answered = sources.some((s) => s.ok)
  return answered ? 'public, s-maxage=60' : 'no-store'
}

/** Search every source for one query */
export async function searchAllSources(query: FabricQuery): Promise<FabricSearchResponse> {
  const settled = await Promise.all(
    sources.map(async (s): Promise<{ status: SourceStatus; listings: FabricListing[] } | null> => {
      if (query.kind === 'notion' && s.fabricOnly) return null
      const base = { id: s.id, name: s.name, kind: s.kind }
      const skip = s.unavailable()
      if (skip) return { status: { ...base, ok: false, count: 0, note: skip }, listings: [] }
      const started = Date.now()
      const deadlineAt = started + SOURCE_DEADLINE_MS
      try {
        const { listings: raw, incomplete } = await s.search(query, deadlineAt)
        const listings = raw.map(safeListing).filter((l): l is FabricListing => l !== null)
        if (listings.length < raw.length) logEvent('warn', 'fabric.source.unsafe', { source: s.id, dropped: raw.length - listings.length, total: raw.length })
        return { status: { ...base, ok: true, count: listings.length, ...(incomplete ? { incomplete } : {}) }, listings }
      } catch (e) {
        logEvent('warn', 'fabric.source.failed', { source: s.id, durationMs: Date.now() - started, ...failureOf(e) })
        return { status: { ...base, ok: false, failed: true, count: 0, note: noteFor(e) }, listings: [] }
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
