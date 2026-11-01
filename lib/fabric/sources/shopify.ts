import { failureOf, fetchJson } from '@/lib/server/fetch-with-retry'
import { createLimiter } from '@/lib/server/limit'
import { logEvent } from '@/lib/server/log'

import type { FabricCondition, FabricListing, FabricQuery } from '../types'
import { parseComposition, parseWidth, stripHtml } from './parse'
import { withReferral } from './referral'
import { parseEach, productResponse, suggestProduct, suggestResponse } from './schemas'

/**
 * Independent fabric shops that run on Shopify. Every Shopify store exposes a public,
 * read-only product search (`/search/suggest.json`) and product data (`/products/<handle>.json`),
 * and accepts cart permalinks (`/cart/<variant>:<qty>`), so Sigrid can search their stock
 * and hand a filled cart to their own checkout without needing an API key.
 */
export interface ShopifyShop {
  id: string
  name: string
  origin: string
  /** Storefront language prefix for English product pages, e.g. "/en" */
  localePath?: string
  currency: string
  /** Length of one sold unit in metres, as the shop states on its product pages */
  unitMeters: number
  /** Where the shop is. Also sets the market we ask for, so prices come back in `currency`. */
  shipsFrom: string
  condition: FabricCondition
}

export const shopifyShops: ShopifyShop[] = [
  // Unit lengths checked against each shop's product pages on 2026-10-11
  { id: 'merchant-mills', name: 'Merchant & Mills', origin: 'https://merchantandmills.com', currency: 'GBP', unitMeters: 0.1, shipsFrom: 'GB', condition: 'new' },
  { id: 'raystitch', name: 'Raystitch', origin: 'https://www.raystitch.co.uk', currency: 'GBP', unitMeters: 0.1, shipsFrom: 'GB', condition: 'new' },
  { id: 'lamazi', name: 'Lamazi Fabrics', origin: 'https://lamazifabrics.com', currency: 'GBP', unitMeters: 0.5, shipsFrom: 'GB', condition: 'new' },
  { id: 'atelier-brunette', name: 'Atelier Brunette', origin: 'https://www.atelierbrunette.com', localePath: '/en', currency: 'EUR', unitMeters: 0.1, shipsFrom: 'FR', condition: 'new' },
  { id: 'selvedge-bolts', name: 'Selvedge & Bolts', origin: 'https://www.selvedgeandbolts.com', currency: 'GBP', unitMeters: 0.5, shipsFrom: 'GB', condition: 'new' },
  { id: 'fabworks', name: 'Fabworks', origin: 'https://www.fabworks.co.uk', currency: 'GBP', unitMeters: 0.5, shipsFrom: 'GB', condition: 'deadstock' },
]

interface Variant {
  id: number
  title: string
  price: string
  available?: boolean
}

/**
 * Shopify converts prices to the visitor's local market (a server in Sweden gets SEK).
 * Ask for the shop's home market so prices always match `shop.currency`.
 */
const headersFor = (shop: ShopifyShop) => ({
  Accept: 'application/json',
  'User-Agent': 'SigridFabricSearch/1.0 (+https://sigrid.app)',
  Cookie: `localization=${shop.shipsFrom}; cart_currency=${shop.currency}`,
})
const REVALIDATE = 60 * 60

/**
 * Every shop here runs on Shopify, which limits requests per visitor across all its shops: asking
 * six shops at once brings 429s with a Retry-After of a minute, even though one shop alone is fine.
 * So they share one line. Two at a time comes to about 15 requests a second, which it accepts, and
 * answers already cached for the hour come back at once. A search is only slow the first time.
 */
const limit = createLimiter(2)

/** What one shop answered. `incomplete` means some of its products couldn't be read this time. */
export interface ShopAnswer {
  listings: FabricListing[]
  incomplete?: boolean
}

/** Products that are not yardage sold by length: fixed remnants, samples, notions, patterns */
const NOT_YARDAGE = /\b(remnants?|coupons?|bundles?|scraps?|samples?|swatch(es)?|patterns?|kits?|books?|gift ?cards?|threads?|zips?|buttons?|needles?|interfacing|bias binding|tape)\b/i
/** Home furnishing cloth: too heavy or stiff for clothes */
const NOT_APPAREL = /\b(curtain(ing)?|upholstery|furnishing|outdoor|canvas tote)\b/i
const NOT_CUT_VARIANT = /sample|swatch|thread|pattern|kit/i

/** Atelier Brunette titles look like `Tissu "Jersey Modal Off-White"`: keep the name */
export const cleanTitle = (t: string) => t.replace(/^tissu\s+/i, '').replace(/["“”]/g, '').trim()

interface ProductBasics {
  id: number | string
  title: string
  handle: string
  body: string
  tags: string[]
  image?: string | null
}

function toListing(
  shop: ShopifyShop,
  p: ProductBasics,
  variant: { id: number; price: string },
  kind: FabricQuery['kind'],
): FabricListing | null {
  const price = Number(variant.price)
  if (!Number.isFinite(price) || price <= 0) return null
  const base = `${shop.origin}${shop.localePath ?? ''}`
  const text = stripHtml(p.body)
  const isDeadstock = [p.title, ...p.tags].some((t) => /deadstock|end of line|surplus/i.test(t))
  return {
    id: `${shop.id}:${p.id}`,
    kind,
    sourceId: shop.id,
    sourceName: shop.name,
    title: cleanTitle(p.title),
    url: withReferral(`${base}/products/${p.handle}`),
    image: p.image ? `${p.image}${p.image.includes('?') ? '&' : '?'}width=600` : undefined,
    condition: kind === 'fabric' && (isDeadstock || shop.condition === 'deadstock') ? 'deadstock' : 'new',
    currency: shop.currency,
    unitPrice: price,
    // Notions (thread, zips, buttons) are sold per item, fabric by length
    unitMeters: kind === 'fabric' ? shop.unitMeters : null,
    composition: kind === 'fabric' ? parseComposition(text) : undefined,
    widthCm: kind === 'fabric' ? parseWidth(text) : undefined,
    shipsFrom: shop.shipsFrom,
    available: true,
    checkout: { kind: 'shopify-cart', origin: shop.origin, variantId: variant.id },
  }
}

const pickVariant = (variants: Variant[]) =>
  variants.find((v) => v.available !== false && !NOT_CUT_VARIANT.test(v.title)) ?? null

/** Search one shop for a fabric (or notion) by keyword */
export async function searchShopify(shop: ShopifyShop, query: FabricQuery, deadlineAt: number): Promise<ShopAnswer> {
  const base = `${shop.origin}${shop.localePath ?? ''}`
  const params = new URLSearchParams({ q: query.q, 'resources[type]': 'product', 'resources[limit]': '10' })
  const data = await limit(() =>
    fetchJson(`${base}/search/suggest.json?${params}`, { headers: headersFor(shop), next: { revalidate: REVALIDATE } }, suggestResponse, {
      op: 'fabric.shopify.search',
      source: shop.id,
      deadlineAt,
    }),
  )
  const products = parseEach(data.resources?.results?.products ?? [], suggestProduct, 'fabric.shopify.search', shop.id)

  const terms = query.match.map((t) => t.toLowerCase())
  // Supplies match whole words: otherwise "needle" finds needlecord and "cord" finds corduroy
  const wholeWord = (hay: string, term: string) => new RegExp(`(^|[^a-z])${term.replace(/[^a-z0-9 -]/g, '')}s?($|[^a-z])`).test(hay)
  const excluded = (query.exclude ?? []).map((t) => t.toLowerCase())
  const matching = products
    .filter((p) => p.available)
    .filter((p) => (query.kind === 'notion' ? !NOT_APPAREL.test(p.title) : !NOT_YARDAGE.test(p.title) && !NOT_APPAREL.test(p.title)))
    .filter((p) => {
      const hay = `${p.title} ${p.type ?? ''} ${(p.tags ?? []).join(' ')}`.toLowerCase()
      if (query.kind === 'notion') return !excluded.some((t) => p.title.toLowerCase().includes(t)) && terms.some((t) => wholeWord(hay, t))
      return terms.some((t) => hay.includes(t))
    })
    .slice(0, query.limit)

  // Suggest results carry no variant ids, and their price can be a sample's; read the product itself.
  // Each product stands alone: one that's slow or odd shouldn't cost the rest of the shop.
  const settled = await Promise.allSettled(
    matching.map((p) =>
      limit(() =>
        fetchJson(`${shop.origin}/products/${encodeURIComponent(p.handle)}.json`, { headers: headersFor(shop), next: { revalidate: REVALIDATE } }, productResponse, {
          op: 'fabric.shopify.product',
          source: shop.id,
          deadlineAt,
        }),
      ),
    ),
  )
  const failed = settled.filter((r) => r.status === 'rejected')
  if (failed.length > 0) {
    logEvent('warn', 'fabric.shopify.products', { source: shop.id, failed: failed.length, total: matching.length, ...failureOf(failed[0].reason) })
    // Nothing came back at all: the shop is down, which isn't the same as having no such fabric
    if (failed.length === matching.length) throw failed[0].reason
  }

  const found = settled.map((r, i): FabricListing | null => {
    if (r.status === 'rejected') return null
    const p = matching[i]
    const variant = pickVariant(r.value.product.variants)
    return variant ? toListing(shop, { ...p, body: p.body ?? '', tags: p.tags ?? [] }, variant, query.kind) : null
  })
  return { listings: found.filter((l): l is FabricListing => l !== null), incomplete: failed.length > 0 }
}
