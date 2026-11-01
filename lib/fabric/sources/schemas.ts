import { z } from 'zod'

import { logEvent } from '@/lib/server/log'

/**
 * What Sigrid relies on in each shop API's answers. The outer shape is checked strictly, because
 * without it there is nothing to show; each product is checked on its own with parseEach, so one
 * odd product is skipped instead of costing the whole shop.
 */

const productList = z.array(z.unknown())
const money = z.union([z.string(), z.number()]).transform(String)
const id = z.union([z.number(), z.string()])

// ── Shopify ──────────────────────────────────────────────────────────────────

export const suggestResponse = z.object({
  resources: z.object({ results: z.object({ products: productList.optional() }).optional() }).optional(),
})

export const suggestProduct = z.object({
  id,
  title: z.string(),
  handle: z.string(),
  available: z.boolean(),
  body: z.string().nullish(),
  type: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  image: z.string().nullish(),
})

const variant = z.object({
  id: z.number(),
  title: z.string(),
  price: money,
  available: z.boolean().optional(),
  featured_image: z.object({ src: z.string() }).nullish(),
})

export const productResponse = z.object({ product: z.object({ variants: z.array(variant) }) })

export const catalogResponse = z.object({ products: productList })

export const catalogProduct = z.object({
  id,
  title: z.string(),
  handle: z.string(),
  body_html: z.string().nullish(),
  product_type: z.string().nullish(),
  tags: z.union([z.array(z.string()), z.string()]).nullish(),
  variants: z.array(variant),
  images: z.array(z.object({ src: z.string() })).nullish(),
  vendor: z.string().nullish(),
  created_at: z.string().nullish(),
  options: z.array(z.object({ name: z.string(), values: z.array(z.string()).optional() })).nullish(),
})

// ── eBay ─────────────────────────────────────────────────────────────────────

export const ebayToken = z.object({ access_token: z.string().min(1), expires_in: z.number().positive() })

export const ebaySearchResponse = z.object({ itemSummaries: productList.optional() })

export const ebayItem = z.object({
  itemId: z.string(),
  title: z.string(),
  price: z.object({ value: z.string(), currency: z.string() }).optional(),
  image: z.object({ imageUrl: z.string() }).optional(),
  itemWebUrl: z.string(),
  itemAffiliateWebUrl: z.string().optional(),
  itemLocation: z.object({ country: z.string().optional() }).optional(),
})

// ── Etsy ─────────────────────────────────────────────────────────────────────

export const etsyResponse = z.object({ results: productList })

export const etsyListing = z.object({
  listing_id: z.number(),
  title: z.string(),
  url: z.string(),
  when_made: z.string().nullish(),
  price: z.object({ amount: z.number(), divisor: z.number().positive(), currency_code: z.string() }),
  images: z.array(z.object({ url_570xN: z.string() })).nullish(),
  shipping_profile: z.object({ origin_country_iso: z.string().nullish() }).nullish(),
})

/** Keeps the items that match, and logs how many didn't: a rising number means a shop changed its API. */
export function parseEach<S extends z.ZodType>(items: unknown[], schema: S, op: string, source: string): z.output<S>[] {
  const valid: z.output<S>[] = []
  for (const item of items) {
    const parsed = schema.safeParse(item)
    if (parsed.success) valid.push(parsed.data)
  }
  if (valid.length < items.length) logEvent('warn', op, { source, reason: 'bad_shape', skipped: items.length - valid.length, total: items.length })
  return valid
}
