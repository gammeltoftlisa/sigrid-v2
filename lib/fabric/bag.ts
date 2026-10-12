import { useSyncExternalStore } from 'react'

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

let cachedRaw: string | null = null
let cached: BagItem[] = EMPTY

function read(): BagItem[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {}
  if (raw === cachedRaw) return cached
  cachedRaw = raw
  try {
    const parsed = raw ? (JSON.parse(raw) as BagItem[]) : EMPTY
    cached = Array.isArray(parsed) ? parsed.filter((i) => i?.listing?.id && i.units > 0) : EMPTY
  } catch {
    cached = EMPTY
  }
  return cached
}

function write(items: BagItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
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

export function removeFromBag(listingId: string) {
  write(read().filter((i) => i.listing.id !== listingId))
}

export interface BagGroup {
  sourceId: string
  sourceName: string
  currency: string
  items: BagItem[]
  total: number
  /** A link to the shop's own cart, filled with these items; null when each item is bought at its listing */
  cartUrl: string | null
}

/** One group per shop, since every shop has its own checkout */
export function groupBag(items: BagItem[]): BagGroup[] {
  const groups = new Map<string, BagGroup>()
  for (const item of items) {
    const { listing } = item
    const g = groups.get(listing.sourceId) ?? {
      sourceId: listing.sourceId,
      sourceName: listing.sourceName,
      currency: listing.currency,
      items: [],
      total: 0,
      cartUrl: null,
    }
    g.items.push(item)
    g.total += listing.unitPrice * item.units
    groups.set(listing.sourceId, g)
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
