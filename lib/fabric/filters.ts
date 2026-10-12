import { approxEur, pricePerMeter } from './pricing'
import type { FabricCondition, FabricListing } from './types'

/** Price per metre in euros, both ends included */
export interface PriceRange {
  min: number
  max: number
}

/** Filters applied in the browser to whatever the shops returned */
export interface FabricFilters {
  conditions: FabricCondition[]
  shops: string[]
  fibres: string[]
  /** Null: any price */
  price: PriceRange | null
}

export const noFilters: FabricFilters = { conditions: [], shops: [], fibres: [], price: null }

export const conditionLabels: Record<FabricCondition, string> = { new: 'New', deadstock: 'Deadstock', secondhand: 'Secondhand' }

export const formatEuro = (n: number) => `€${Math.round(n)}`
export const priceLabel = (p: PriceRange) => `${formatEuro(p.min)}–${formatEuro(p.max)} per metre`

/** Fibre words → the family shown in the filter */
const FAMILIES: [RegExp, string][] = [
  [/cotton/, 'Cotton'],
  [/linen|flax/, 'Linen'],
  [/wool|merino|cashmere|alpaca|mohair/, 'Wool'],
  [/viscose|rayon|modal|lyocell|tencel|cupro|ecovero|bamboo/, 'Viscose & lyocell'],
  [/silk/, 'Silk'],
  [/hemp|ramie/, 'Hemp'],
  [/polyester|polyamide|nylon|acrylic|polyurethane/, 'Synthetic'],
]

const familyOf = (word: string) => FAMILIES.find(([re]) => re.test(word))?.[1] ?? null

/** The fibre the fabric is mostly made of, from its composition ("55% Cotton, 40% Modal" → Cotton) */
export function mainFibre(l: FabricListing): string | null {
  const text = (l.composition ?? l.title).toLowerCase()
  let best: { share: number; family: string } | null = null
  for (const m of text.matchAll(/(\d{1,3})\s?%\s?([a-zé ]+?)(?=,|$|\d)/g)) {
    const family = familyOf(m[2])
    if (family && (!best || Number(m[1]) > best.share)) best = { share: Number(m[1]), family }
  }
  if (best) return best.family
  // No percentages: the first fibre named
  for (const word of text.split(/[^a-zé]+/)) {
    const family = familyOf(word)
    if (family && !/elast|spandex|lycra/.test(word)) return family
  }
  return null
}

/** Rough price per metre in euros, for the price filter; null when the length isn't known */
export function eurPerMeter(l: FabricListing): number | null {
  const perMeter = pricePerMeter(l) ?? (l.pieceMeters ? l.unitPrice / l.pieceMeters : null)
  return perMeter === null ? null : approxEur(perMeter, l.currency)
}

function inRange(l: FabricListing, range: PriceRange | null): boolean {
  if (!range) return true
  const p = eurPerMeter(l)
  // Compare in whole euros, as the slider and inputs show them
  return p !== null && Math.round(p) >= range.min && Math.round(p) <= range.max
}

/** Lowest and highest price per metre in the results, in whole euros, for the slider's ends */
export function priceBounds(listings: FabricListing[]): PriceRange | null {
  const prices = listings.map(eurPerMeter).filter((p): p is number => p !== null)
  if (prices.length === 0) return null
  const min = Math.floor(Math.min(...prices))
  const max = Math.ceil(Math.max(...prices))
  return { min, max: Math.max(max, min + 1) }
}

/** Does the listing pass every filter, optionally ignoring one (for that filter's own counts)? */
export function passes(l: FabricListing, f: FabricFilters, ignore?: keyof FabricFilters): boolean {
  if (ignore !== 'conditions' && f.conditions.length && !f.conditions.includes(l.condition)) return false
  if (ignore !== 'shops' && f.shops.length && !f.shops.includes(l.sourceId)) return false
  if (ignore !== 'fibres' && f.fibres.length) {
    const fibre = mainFibre(l)
    if (!fibre || !f.fibres.includes(fibre)) return false
  }
  if (ignore !== 'price' && !inRange(l, f.price)) return false
  return true
}

export interface FacetOption {
  value: string
  label: string
  count: number
}

/** The options for each filter, with how many results each would give alongside the other filters */
export function facets(listings: FabricListing[], f: FabricFilters) {
  const count = <T extends string>(key: keyof FabricFilters, valueOf: (l: FabricListing) => T | null, selected: T[]) => {
    const counts = new Map<T, number>()
    for (const l of listings) {
      if (!passes(l, f, key)) continue
      const v = valueOf(l)
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
    }
    // Keep chosen options visible even when nothing matches them right now
    for (const s of selected) if (!counts.has(s)) counts.set(s, 0)
    return counts
  }

  const conditions = count('conditions', (l) => l.condition, f.conditions)
  const shops = count('shops', (l) => l.sourceId, f.shops)
  const fibres = count('fibres', mainFibre, f.fibres)
  const shopName = new Map(listings.map((l) => [l.sourceId, l.sourceName]))

  return {
    conditions: (['new', 'deadstock', 'secondhand'] as const).map((c) => ({ value: c, label: conditionLabels[c], count: conditions.get(c) ?? 0 })),
    shops: [...shops].map(([value, n]) => ({ value, label: shopName.get(value) ?? value, count: n })).sort((a, b) => a.label.localeCompare(b.label)),
    fibres: [...fibres].map(([value, n]) => ({ value, label: value, count: n })).sort((a, b) => b.count - a.count),
    price: priceBounds(listings.filter((l) => passes(l, f, 'price'))),
  }
}

export function activeFilterCount(f: FabricFilters): number {
  return f.conditions.length + f.shops.length + f.fibres.length + (f.price ? 1 : 0)
}
