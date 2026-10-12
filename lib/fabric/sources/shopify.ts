import type { FabricCondition, FabricListing, FabricQuery } from '../types'
import { withReferral } from './referral'

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

interface SuggestProduct {
  id: number
  title: string
  handle: string
  available: boolean
  body?: string
  type?: string
  tags?: string[]
  image?: string | null
}

interface ProductJson {
  product: { variants: { id: number; title: string; price: string; available?: boolean }[] }
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

/** Products that are not yardage sold by length: fixed remnants, samples, notions, patterns */
const NOT_YARDAGE = /\b(remnants?|coupons?|bundles?|scraps?|samples?|swatch(es)?|patterns?|kits?|books?|gift ?cards?|threads?|zips?|buttons?|needles?|interfacing|bias binding|tape)\b/i
/** Home furnishing cloth: too heavy or stiff for clothes */
const NOT_APPAREL = /\b(curtain(ing)?|upholstery|furnishing|outdoor|canvas tote)\b/i
const NOT_CUT_VARIANT = /sample|swatch|thread|pattern|kit/i

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;| /g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')

const QUALIFIERS = '(?:(?:soft|pure|fine|combed|brushed|organic|gots|certified|mercerised|mercerized|recycled|european|egyptian|pima|merino|mulberry)\\s+)*'
const FIBRES = 'cotton|linen|flax|hemp|ramie|viscose|rayon|modal|lyocell|tencel|cupro|ecovero|bamboo|polyester|polyamide|nylon|elastane|elasthane|spandex|lycra|polyurethane|acrylic|acetate|wool|cashmere|alpaca|mohair|silk|metallic|lurex'
const FIBRE = new RegExp(`(\\d{1,3}(?:[.,]\\d)?)\\s?%\\s?(${QUALIFIERS}(?:${FIBRES})\\w*)`, 'gi')
const title = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())

/** "Composition: 55% cotton - 40% Modal - 5% Elasthane" → "55% Cotton, 40% Modal, 5% Elasthane" */
function parseComposition(text: string): string | undefined {
  const label = text.search(/composition|fibre content|fiber content|content\s*:/i)
  const scope = label >= 0 ? text.slice(label, label + 140) : text
  const fibres = [...scope.matchAll(FIBRE)]
  if (fibres.length > 0) {
    // Keep only the first run of percentages; descriptions often repeat the composition
    const first = fibres[0].index ?? 0
    const run = fibres.filter((m) => (m.index ?? 0) - first < 90).map((m) => `${m[1]}% ${title(m[2].toLowerCase())}`)
    return [...new Set(run)].join(', ')
  }
  if (label < 0) return undefined
  const words = scope.match(/:\s*([A-Za-zé&,\s]{3,40}?)(?=\s+(?:width|weight|gsm|colour|color|care|wash|stretch)\b|[.:]|$)/i)
  return words?.[1].trim() || undefined
}

function parseWidth(text: string): number | undefined {
  const m = text.match(/width\s*:?\s*(\d{2,3})\s*cm/i) ?? text.match(/(\d{2,3})\s*cm\s*(?:wide|width)/i)
  const w = m ? Number(m[1]) : NaN
  return w >= 80 && w <= 330 ? w : undefined
}

/** Atelier Brunette titles look like `Tissu "Jersey Modal Off-White"`: keep the name */
const cleanTitle = (t: string) => t.replace(/^tissu\s+/i, '').replace(/["“”]/g, '').trim()

interface ProductBasics {
  id: number
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

const pickVariant = (variants: ProductJson['product']['variants']) =>
  variants.find((v) => v.available !== false && !NOT_CUT_VARIANT.test(v.title)) ?? null

/** Search one shop for a fabric (or notion) by keyword */
export async function searchShopify(shop: ShopifyShop, query: FabricQuery): Promise<FabricListing[]> {
  const base = `${shop.origin}${shop.localePath ?? ''}`
  const params = new URLSearchParams({ q: query.q, 'resources[type]': 'product', 'resources[limit]': '10' })
  const res = await fetch(`${base}/search/suggest.json?${params}`, {
    headers: headersFor(shop),
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as { resources?: { results?: { products?: SuggestProduct[] } } }
  const products = data.resources?.results?.products ?? []

  const terms = query.match.map((t) => t.toLowerCase())
  const matching = products
    .filter((p) => p.available)
    .filter((p) => (query.kind === 'notion' ? !NOT_APPAREL.test(p.title) : !NOT_YARDAGE.test(p.title) && !NOT_APPAREL.test(p.title)))
    .filter((p) => {
      const hay = `${p.title} ${p.type ?? ''} ${(p.tags ?? []).join(' ')}`.toLowerCase()
      return terms.some((t) => hay.includes(t))
    })
    .slice(0, query.limit)

  const listings = await Promise.all(
    matching.map(async (p): Promise<FabricListing | null> => {
      // Suggest results carry no variant ids, and their price can be a sample's; read the product itself
      const pr = await fetch(`${shop.origin}/products/${encodeURIComponent(p.handle)}.json`, {
        headers: headersFor(shop),
        next: { revalidate: REVALIDATE },
        signal: AbortSignal.timeout(8000),
      })
      if (!pr.ok) return null
      const variant = pickVariant(((await pr.json()) as ProductJson).product.variants)
      if (!variant) return null
      return toListing(shop, { ...p, body: p.body ?? '', tags: p.tags ?? [] }, variant, query.kind)
    }),
  )
  return listings.filter((l): l is FabricListing => l !== null)
}

interface CatalogProduct {
  id: number
  title: string
  handle: string
  body_html: string | null
  product_type: string
  tags: string[] | string
  variants: { id: number; title: string; price: string; available?: boolean }[]
  images: { src: string }[]
}

/**
 * The shop's latest products, kept to dress fabric only: for browsing the whole store
 * when no garment is chosen. One request per shop, since the feed already has variants.
 */
export async function browseShopify(shop: ShopifyShop, limit: number): Promise<FabricListing[]> {
  const res = await fetch(`${shop.origin}/products.json?limit=60`, {
    headers: headersFor(shop),
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { products } = (await res.json()) as { products: CatalogProduct[] }

  const out: FabricListing[] = []
  for (const p of products) {
    if (out.length >= limit) break
    if (NOT_YARDAGE.test(p.title) || NOT_APPAREL.test(p.title)) continue
    const tags = Array.isArray(p.tags) ? p.tags : p.tags.split(',').map((t) => t.trim())
    const body = p.body_html ?? ''
    // A dress fabric says it is one, or states its fibres
    const isFabric = /fabric|jersey|knit|woven|tissu/i.test(p.product_type) || !!parseComposition(stripHtml(body))
    if (!isFabric) continue
    const variant = pickVariant(p.variants)
    if (!variant) continue
    const listing = toListing(shop, { id: p.id, title: p.title, handle: p.handle, body, tags, image: p.images[0]?.src }, variant, 'fabric')
    if (listing) out.push(listing)
  }
  return out
}
