import 'server-only'

import { cache } from 'react'
import { z } from 'zod'

import { IMAGE_HOSTS } from '@/lib/fabric/safe-listing'
import { catalogProduct } from '@/lib/fabric/sources/schemas'
import { shopifyShops, type ShopifyShop } from '@/lib/fabric/sources/shopify'
import { failureOf, fetchJson } from '@/lib/server/fetch-with-retry'
import { logEvent } from '@/lib/server/log'

import type { RawProduct } from './classify'
import { handleOf } from './href'
import { toShopItem, withWidth } from './item'
import { getCatalogue } from './store'
import { conditionLabel, facetLabels, getCategory, subLabel, type FacetId } from './taxonomy'
import type { ShopItem } from './types'

/** A piece of the shop's own description, as plain text: never the shop's HTML */
export type AboutBlock = { kind: 'p'; text: string } | { kind: 'list'; items: string[] }

export interface ProductDetail {
  item: ShopItem
  /** Every photo the shop has of it, the cover first */
  photos: string[]
  /** The shop's description, cleaned */
  about: AboutBlock[]
  /** Everything known about it, label and value */
  facts: { label: string; value: string }[]
  /** What the choice is called, e.g. "Colour" or "Size" */
  optionName?: string
  /** False when the shop says every variant is sold out */
  available: boolean
  /** The shop didn't answer, so this is the catalogue's copy: one photo, no description */
  partial: boolean
  /** More from the same subcategory, then the same category */
  more: ShopItem[]
}

const productResponse = z.object({ product: catalogProduct })

const headersFor = (shop: ShopifyShop) => ({
  Accept: 'application/json',
  'User-Agent': 'SigridFabricSearch/1.0 (+https://sigrid.app)',
  Cookie: `localization=${shop.shipsFrom}; cart_currency=${shop.currency}`,
})

const HANDLE = /^[\p{L}\p{N}][\p{L}\p{N}_-]{0,250}$/u

/** The product as the shop has it now, or null when it doesn't (any more) */
async function readLive(shop: ShopifyShop, handle: string): Promise<RawProduct | null> {
  try {
    const data = await fetchJson(
      `${shop.origin}${shop.localePath ?? ''}/products/${encodeURIComponent(handle)}.json`,
      { headers: headersFor(shop), next: { revalidate: 60 * 60 } },
      productResponse,
      { op: 'shop.product', source: shop.id, timeoutMs: 8_000, retries: 1 },
    )
    return data.product as RawProduct
  } catch (e) {
    const failure = failureOf(e)
    if (failure.status === 404) return null
    logEvent('warn', 'shop.product', { source: shop.id, ...failure })
    throw e
  }
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', deg: '°', times: '×', frac12: '½' }
const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''
    }
    return ENTITIES[code.toLowerCase()] ?? m
  })

/** Lines about the shop's own page, which mean nothing here: "Specifications:", "Please select a size from the dropdown" */
const SHOP_CHROME = /^[^.!?]{1,40}:$|\b(select|choose|pick)\b.*\b(dropdown|drop-down|menu|below|above|to the (left|right))\b|corresponding price|add to (cart|basket)/i

/** "Width: 140 cm" read as a fact; a sentence with a colon in it isn't one */
const FACT = /^([\p{L}][\p{L} /&()-]{1,28}?)\s*:\s*(.{1,120})$/u

/** The shop's description as paragraphs, lists and "Label: value" facts. Tags are dropped, so nothing of theirs runs here. */
export function readDescription(html: string): { about: AboutBlock[]; facts: { label: string; value: string }[] } {
  const text = decode(
    html
      .replace(/<(script|style|iframe|noscript)[\s\S]*?<\/\1>/gi, '')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr|table|section)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
  const about: AboutBlock[] = []
  const facts: { label: string; value: string }[] = []
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+/g, ' ').trim()
    if (!line) continue
    const bullet = line.startsWith('•')
    const body = bullet ? line.slice(1).replace(/^[\s\-–•]+/, '').trim() : line.replace(/^[-–•*]\s+/, '')
    if (!body || SHOP_CHROME.test(body)) continue
    const fact = body.match(FACT)
    // A short label, and a value that isn't the rest of a sentence ("Our tip: press every seam as you go.")
    const sentence = fact && /^\p{Ll}/u.test(fact[2]) && fact[2].split(' ').length > 3
    if (fact && !sentence && fact[1].split(' ').length <= 3) {
      facts.push({ label: fact[1].trim().replace(/^\p{L}/u, (c) => c.toUpperCase()), value: fact[2].trim() })
      continue
    }
    const last = about.at(-1)
    if (bullet || /^[-–•*]\s/.test(line)) {
      if (last?.kind === 'list') last.items.push(body)
      else about.push({ kind: 'list', items: [body] })
    } else about.push({ kind: 'p', text: body })
  }
  return { about: about.slice(0, 40), facts: facts.slice(0, 16) }
}

const baseOf = (src: string) => src.split('?')[0]

/** Every photo, the cover first and each once, from hosts we allow */
function photosOf(p: RawProduct | null, item: ShopItem): string[] {
  const all = [...(p?.images ?? []).map((i) => i.src), ...(p?.variants ?? []).map((v) => v.featured_image?.src)]
  const seen = new Set<string>()
  const photos: string[] = []
  for (const src of [item.image, ...all]) {
    if (!src) continue
    try {
      const url = new URL(src.startsWith('//') ? `https:${src}` : src)
      if (url.protocol !== 'https:' || !IMAGE_HOSTS.includes(url.hostname)) continue
      const base = baseOf(url.toString())
      if (seen.has(base)) continue
      seen.add(base)
      photos.push(withWidth(base, 1200))
    } catch {
      // Not a URL: leave it out
    }
  }
  return photos.slice(0, 12)
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

/** What we know of it ourselves, then what the shop's description says that we don't */
function factsOf(item: ShopItem, fromShop: { label: string; value: string }[]): { label: string; value: string }[] {
  const category = getCategory(item.category)
  const own: { label: string; value: string }[] = []
  if (category) own.push({ label: 'Category', value: `${category.name} · ${subLabel(category, item.sub)}` })
  if (item.composition) own.push({ label: 'Composition', value: item.composition })
  if (item.widthCm) own.push({ label: 'Width', value: `${item.widthCm} cm` })
  const shown: FacetId[] = ['type', 'material', 'weight', 'stretch', 'pattern', 'colour', 'spool', 'needleFor', 'brand', 'eco']
  for (const id of shown) {
    const values = item.facets[id]
    if (!values?.length) continue
    if (id === 'material' && item.composition) continue
    own.push({ label: facetLabels[id], value: values.join(', ') })
  }
  if (item.unitMeters) own.push({ label: 'Sold in', value: item.unitMeters === 0.5 ? 'Half metres' : `Lengths of ${Math.round(item.unitMeters * 100)} cm` })
  own.push({ label: 'Condition', value: conditionLabel[item.condition] })
  own.push({ label: 'Shop', value: item.sourceName })
  own.push({ label: 'Ships from', value: regionNames.of(item.shipsFrom) ?? item.shipsFrom })

  const known = new Set(own.map((f) => f.label.toLowerCase()))
  const alias: Record<string, string> = { 'fibre content': 'composition', 'fiber content': 'composition', content: 'composition', fabric: 'composition', colour: 'colour', color: 'colour' }
  const extra = fromShop.filter((f) => {
    const key = alias[f.label.toLowerCase()] ?? f.label.toLowerCase()
    if (known.has(key)) return false
    known.add(key)
    return true
  })
  return [...own, ...extra]
}

/** What the shop calls the choice: "Colour", "Size", or both */
function optionNameOf(p: RawProduct | null): string | undefined {
  const names = (p?.options ?? []).map((o) => o.name).filter((n) => n && !/^(title|options?)$/i.test(n))
  return names.length ? names.join(' and ') : undefined
}

function moreLike(items: ShopItem[], item: ShopItem): ShopItem[] {
  const others = items.filter((i) => i.id !== item.id && i.category === item.category)
  const sameSub = others.filter((i) => i.sub === item.sub)
  const rest = others.filter((i) => i.sub !== item.sub)
  return [...sameSub, ...rest].slice(0, 5)
}

/**
 * One product, by shop and handle: the store's own record of it, with every photo and the full
 * description read from the shop. When the shop doesn't answer, the catalogue's copy is shown.
 * Null when there's no such shop or product.
 */
export const getProduct = cache(async (shopId: string, handle: string): Promise<ProductDetail | null> => {
  const shop = shopifyShops.find((s) => s.id === shopId)
  if (!shop || !HANDLE.test(handle)) return null

  const [catalogue, live] = await Promise.allSettled([getCatalogue(), readLive(shop, handle)])
  const items = catalogue.status === 'fulfilled' ? catalogue.value.items : []
  const stored = items.find((i) => i.sourceId === shop.id && handleOf(i.url) === handle)
  const raw = live.status === 'fulfilled' ? live.value : null

  // The shop's copy is today's prices and variants; the catalogue's is the fallback
  const fresh = raw ? toShopItem(shop, raw, stored?.rank ?? 0, stored?.createdAt) : null
  const item = fresh ?? stored
  if (!item) return null

  const { about, facts } = readDescription(raw?.body_html ?? '')
  return {
    item,
    photos: photosOf(raw, item),
    about,
    facts: factsOf(item, facts),
    optionName: optionNameOf(raw),
    available: raw ? raw.variants.some((v) => v.available !== false) : true,
    partial: live.status === 'rejected',
    more: moreLike(items, item),
  }
})
