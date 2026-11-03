import { parseComposition, parseWidth, stripHtml } from '../fabric/sources/parse'
import { withReferral } from '../fabric/sources/referral'
import { cleanTitle, type ShopifyShop } from '../fabric/sources/shopify'
import { approxEur } from '../fabric/pricing'
import { safeListing } from '../fabric/safe-listing'
import type { FabricListing } from '../fabric/types'

import { bucket, classify, coloursIn, millimetres, SIZE_FACET, subOf, tagsOf, type Facets, type RawProduct, type RawVariant } from './classify'
import { conditionLabel } from './taxonomy'
import type { ShopItem, ShopVariant } from './types'

const NOT_A_CUT = /sample|swatch|thread|pattern|kit/i
const sellable = (v: RawVariant) => v.available !== false && !NOT_A_CUT.test(v.title) && Number(v.price) > 0
export const withWidth = (src: string, w: number) => `${src}${src.includes('?') ? '&' : '?'}width=${w}`

/** What's true of one variant: its colour and size, from its own name */
function variantFacets(p: RawProduct, v: RawVariant, sizeFacet: (typeof SIZE_FACET)[keyof typeof SIZE_FACET]): Facets {
  const facets: Facets = {}
  const colour = coloursIn(v.title)
  if (colour.length) facets.colour = colour
  if (sizeFacet) {
    const sizes = bucket(millimetres(v.title), sizeFacet.buckets)
    if (sizes.length) facets[sizeFacet.facet] = sizes
  }
  return facets
}

/** One product from a shop's feed as a store item, or null when it isn't something the store sells */
export function toShopItem(shop: ShopifyShop, p: RawProduct, rank: number, created?: string | null): ShopItem | null {
  const classified = classify(p)
  if (!classified) return null
  const { category, facets, priceUnit } = classified
  const sub = subOf(category, facets, p.title)
  if (!sub) return null

  const variants = p.variants.filter(sellable)
  const first = variants[0]
  if (!first) return null

  const body = stripHtml(p.body_html ?? '')
  // Linings are cloth, sold by length like any other. Interfacing and the rest are sold as the shop says.
  const byLength = category === 'fabric' || (category === 'lining' && facets.type?.includes('Lining') === true)
  const isDeadstock = shop.condition === 'deadstock' || [p.title, ...tagsOf(p)].some((t) => /deadstock|dead stock|end of line|surplus/i.test(t))
  const condition = byLength && isDeadstock ? 'deadstock' : 'new'
  const base = `${shop.origin}${shop.localePath ?? ''}`

  const listing: FabricListing = {
    id: `${shop.id}:${p.id}`,
    kind: byLength ? 'fabric' : 'notion',
    sourceId: shop.id,
    sourceName: shop.name,
    title: cleanTitle(p.title),
    url: withReferral(`${base}/products/${p.handle}`),
    image: p.images?.[0]?.src ? withWidth(p.images[0].src, 600) : undefined,
    condition,
    currency: shop.currency,
    unitPrice: Number(first.price),
    unitMeters: byLength ? shop.unitMeters : null,
    composition: byLength ? parseComposition(body) : undefined,
    widthCm: byLength ? parseWidth(body) : undefined,
    shipsFrom: shop.shipsFrom,
    available: true,
    checkout: { kind: 'shopify-cart', origin: shop.origin, variantId: first.id },
  }
  const safe = safeListing(listing)
  if (!safe) return null

  const sizeFacet = SIZE_FACET[category]
  const choices: ShopVariant[] | undefined =
    variants.length > 1
      ? variants.map((v) => ({
          id: v.id,
          label: v.title,
          price: Number(v.price),
          image: v.featured_image?.src ? withWidth(v.featured_image.src, 600) : undefined,
          facets: variantFacets(p, v, sizeFacet),
        }))
      : undefined

  // Every facet that's true of one of its variants is true of the product
  const merged: Facets = { ...facets, condition: [conditionLabel[condition]], shop: [shop.name] }
  for (const v of choices ?? []) {
    for (const [key, values] of Object.entries(v.facets ?? {}) as [keyof Facets, string[]][]) merged[key] = [...new Set([...(merged[key] ?? []), ...values])]
  }

  const perMetre = byLength ? safe.unitPrice / shop.unitMeters : safe.unitPrice
  return {
    ...safe,
    category,
    sub,
    facets: merged,
    priceUnit: byLength ? undefined : priceUnit,
    variants: choices,
    eur: Math.round(approxEur(perMetre, shop.currency) * 100) / 100,
    createdAt: created ?? undefined,
    rank,
  }
}
