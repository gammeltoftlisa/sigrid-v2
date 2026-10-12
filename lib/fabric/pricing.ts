import type { FabricListing } from './types'

/** Units to order so the cut is at least `meters` long */
export function unitsFor(listing: FabricListing, meters: number): number {
  if (!listing.unitMeters) return 1
  return Math.max(1, Math.ceil(meters / listing.unitMeters - 1e-9))
}

export function pricePerMeter(listing: FabricListing): number | null {
  return listing.unitMeters ? listing.unitPrice / listing.unitMeters : null
}

/** Whether the listing covers the length needed: true / false, or null when the seller doesn't say */
export function coversLength(listing: FabricListing, meters: number): boolean | null {
  if (listing.unitMeters) return true
  if (listing.pieceMeters == null) return null
  return listing.pieceMeters + 1e-9 >= meters
}

/** Rough euro rates, only to sort listings in different currencies. Prices shown are always the shop's own. */
const APPROX_EUR: Record<string, number> = { EUR: 1, GBP: 1.17, SEK: 0.088, DKK: 0.134, NOK: 0.086, USD: 0.9, CAD: 0.66, NZD: 0.55, AUD: 0.6 }

export function approxEur(amount: number, currency: string): number {
  return amount * (APPROX_EUR[currency] ?? 1)
}

/** What the length for this size costs (or the piece, for secondhand) */
export function costFor(listing: FabricListing, meters: number): number {
  return unitsFor(listing, meters) * listing.unitPrice
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatMeters(m: number): string {
  return `${Number(m.toFixed(2))} m`
}

/** "10 cm", "½ m", "1 m" */
export function unitLabel(unitMeters: number): string {
  if (unitMeters === 0.5) return '½ m'
  if (unitMeters < 1) return `${Math.round(unitMeters * 100)} cm`
  return `${unitMeters} m`
}
