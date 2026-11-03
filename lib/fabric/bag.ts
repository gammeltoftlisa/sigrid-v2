import { useSyncExternalStore } from 'react'
import { z } from 'zod'

import { parseStored, readRaw, validEntries, writeRaw } from '../local-store'
import { withReferral } from './sources/referral'
import type { FabricListing } from './types'

/** Fabric the user wants to buy. Kept in the browser; checkout happens at each shop. */
export interface BagItem {
  listing: FabricListing
  /** Sold units (e.g. 18 × 10 cm), or 1 for a secondhand piece */
  units: number
  garmentId: string
}

const KEY = 'sigrid_fabric_bag'
const EVENT = 'sigrid-bag-change'
const EMPTY: BagItem[] = []

const httpsUrl = z.string().refine((u) => u.startsWith('https://'))

/** What the bag and its checkout links rely on. A bag saved by an older version may not have all of it. */
const bagItemSchema = z.looseObject({
  units: z.number().int().positive(),
  garmentId: z.string(),
  listing: z.looseObject({
    id: z.string().min(1),
    sourceId: z.string(),
    sourceName: z.string(),
    title: z.string(),
    url: httpsUrl,
    currency: z.string(),
    unitPrice: z.number().positive(),
    checkout: z.discriminatedUnion('kind', [
      z.looseObject({ kind: z.literal('shopify-cart'), origin: httpsUrl, variantId: z.number() }),
      z.looseObject({ kind: z.literal('link') }),
    ]),
  }),
})

let cachedRaw: string | null = null
let cached: BagItem[] = EMPTY

function read(): BagItem[] {
  const raw = readRaw(KEY)
  if (raw === cachedRaw) return cached
  cachedRaw = raw
  const result = parseStored(KEY, raw, z.array(z.unknown()))
  cached = result.status === 'ok' ? (validEntries(result.value, bagItemSchema) as unknown as BagItem[]) : EMPTY
  return cached
}

function write(items: BagItem[]) {
  writeRaw(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useBag(): BagItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}

export function addToBag(item: BagItem) {
  write([...read().filter((i) => i.listing.id !== item.listing.id), item])
}

export function setUnits(listingId: string, units: number) {
  write(read().map((i) => (i.listing.id === listingId ? { ...i, units: Math.max(1, units) } : i)))
}

/** Puts a removed line back where it was, for Undo */
export function restoreToBag(item: BagItem, index: number) {
  const rest = read().filter((i) => i.listing.id !== item.listing.id)
  write([...rest.slice(0, index), item, ...rest.slice(index)])
}

export function removeFromBag(listingId: string) {
  write(read().filter((i) => i.listing.id !== listingId))
}

export interface BagGroup {
  /** Unique per group: one marketplace can have sellers in different currencies */
  key: string
  sourceId: string
  sourceName: string
  currency: string
  items: BagItem[]
  total: number
  /** A link to the shop's own cart, filled with these items; null when each item is bought at its listing */
  cartUrl: string | null
}

/** One group per shop, since every shop has its own checkout, and per currency, since a total can't mix them */
export function groupBag(items: BagItem[]): BagGroup[] {
  const groups = new Map<string, BagGroup>()
  for (const item of items) {
    const { listing } = item
    const key = `${listing.sourceId}:${listing.currency}`
    const g = groups.get(key) ?? {
      key,
      sourceId: listing.sourceId,
      sourceName: listing.sourceName,
      currency: listing.currency,
      items: [],
      total: 0,
      cartUrl: null,
    }
    g.items.push(item)
    g.total += listing.unitPrice * item.units
    groups.set(key, g)
  }
  for (const g of groups.values()) {
    const carts = g.items.map((i) => i.listing.checkout)
    if (carts.every((c) => c.kind === 'shopify-cart')) {
      const origin = carts[0].kind === 'shopify-cart' ? carts[0].origin : ''
      const lines = g.items.map((i) => (i.listing.checkout.kind === 'shopify-cart' ? `${i.listing.checkout.variantId}:${i.units}` : ''))
      g.cartUrl = withReferral(`${origin}/cart/${lines.join(',')}`)
    }
  }
  return [...groups.values()]
}
