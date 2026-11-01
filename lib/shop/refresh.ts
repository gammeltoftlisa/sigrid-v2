import 'server-only'

import { catalogProduct, catalogResponse, parseEach } from '@/lib/fabric/sources/schemas'
import { shopifyShops, type ShopifyShop } from '@/lib/fabric/sources/shopify'
import { getDb } from '@/lib/server/db'
import { failureOf, fetchJson } from '@/lib/server/fetch-with-retry'
import { createLimiter } from '@/lib/server/limit'
import { logEvent } from '@/lib/server/log'

import type { RawProduct } from './classify'
import { curate } from './curate'
import { toShopItem } from './item'
import { forgetCatalogue } from './store'
import type { ShopItem } from './types'

const PAGE = 250
const MAX_PAGES = 40

const headersFor = (shop: ShopifyShop) => ({
  Accept: 'application/json',
  'User-Agent': 'SigridFabricSearch/1.0 (+https://sigrid.app)',
  Cookie: `localization=${shop.shipsFrom}; cart_currency=${shop.currency}`,
})

// One page at a time: every shop here is on Shopify, which limits requests per visitor across all its shops
const line = createLimiter(1)

/** A shop's whole feed. Any page failing fails the shop. */
async function readShop(shop: ShopifyShop): Promise<ShopItem[]> {
  const items: ShopItem[] = []
  let rank = 0
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await line(() =>
      fetchJson(
        `${shop.origin}${shop.localePath ?? ''}/products.json?limit=${PAGE}&page=${page}`,
        { headers: headersFor(shop), cache: 'no-store' },
        catalogResponse,
        { op: 'shop.refresh.page', source: shop.id, timeoutMs: 20_000, retries: 3 },
      ),
    )
    if (data.products.length === 0) break
    for (const p of parseEach(data.products, catalogProduct, 'shop.refresh.page', shop.id)) {
      if (!p.variants.some((v) => v.available !== false)) continue
      const item = toShopItem(shop, p as RawProduct, rank++, p.created_at)
      if (item) items.push(item)
    }
    if (data.products.length < PAGE) break
  }
  return items
}

export interface RefreshSummary {
  saved: boolean
  shops: { id: string; ok: boolean; read: number; carried: number }[]
  total: number
  durationMs: number
}

/**
 * Reads what the shops sell, chooses what the store carries, and replaces the catalogue in one go.
 * If any shop fails, today's catalogue stays: a selection made without that shop would drop all of its products.
 */
export async function refreshCatalogue(): Promise<RefreshSummary> {
  const startedAt = Date.now()
  const at = new Date().toISOString()
  const read = await Promise.all(
    shopifyShops.map(async (shop) => {
      try {
        return { shop, items: await readShop(shop) }
      } catch (e) {
        logEvent('warn', 'shop.refresh.shop', { source: shop.id, ...failureOf(e) })
        return { shop, items: null }
      }
    }),
  )

  const complete = read.every((r) => r.items?.length)
  const chosen = complete ? curate(read.flatMap((r) => r.items ?? [])) : []
  if (complete && chosen.length > 0) {
    const db = getDb()
    await db(
      `INSERT INTO shop_products (id, source, data, refreshed_at)
       SELECT x->>'id', x->>'sourceId', x, $2::timestamptz FROM jsonb_array_elements($1::jsonb) AS x
       ON CONFLICT (id) DO UPDATE SET source = EXCLUDED.source, data = EXCLUDED.data, refreshed_at = EXCLUDED.refreshed_at`,
      [JSON.stringify(chosen), at],
      { timeoutMs: 30_000 },
    )
    await db('DELETE FROM shop_products WHERE refreshed_at < $1::timestamptz', [at], { timeoutMs: 15_000 })
    forgetCatalogue()
  }

  const summary: RefreshSummary = {
    saved: complete && chosen.length > 0,
    shops: read.map((r) => ({ id: r.shop.id, ok: !!r.items?.length, read: r.items?.length ?? 0, carried: chosen.filter((i) => i.sourceId === r.shop.id).length })),
    total: chosen.length,
    durationMs: Date.now() - startedAt,
  }
  logEvent(summary.saved ? 'info' : 'warn', 'shop.refresh', { ...summary })
  return summary
}
