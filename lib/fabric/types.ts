/** New from a shop, rescued mill ends / deadstock, or used (secondhand / vintage). */
export type FabricCondition = 'new' | 'deadstock' | 'secondhand'

export type SourceKind = 'shop' | 'deadstock' | 'secondhand'

/** How a listing is bought: added to the shop's own cart, or opened at the seller. */
export type Checkout =
  | { kind: 'shopify-cart'; origin: string; variantId: number }
  | { kind: 'link' }

/** One fabric for sale, normalised across every source. */
export interface FabricListing {
  /** `${sourceId}:${productId}`, stable across searches */
  id: string
  /** Fabric is sold by length; notions (thread, zips, buttons) per item */
  kind: 'fabric' | 'notion'
  sourceId: string
  sourceName: string
  title: string
  /** Product page at the seller, with Sigrid's referral parameters */
  url: string
  image?: string
  condition: FabricCondition
  /** ISO 4217, e.g. GBP */
  currency: string
  /** Price of one sold unit, in major units (e.g. 2.40 for £2.40) */
  unitPrice: number
  /** Length of one sold unit in metres (0.1 = sold per 10 cm). Null when sold as one fixed piece. */
  unitMeters: number | null
  /** Length of a fixed piece in metres, when the seller says so (secondhand) */
  pieceMeters?: number | null
  composition?: string
  widthCm?: number
  /** Country the parcel ships from, ISO 3166 alpha-2 */
  shipsFrom: string
  available: boolean
  checkout: Checkout
}

export interface SourceStatus {
  id: string
  name: string
  kind: SourceKind
  ok: boolean
  count: number
  /** Why a source was skipped or failed, in plain words */
  note?: string
}

export interface FabricSearchResponse {
  listings: FabricListing[]
  sources: SourceStatus[]
}

export interface FabricQuery {
  /** Free-text search sent to each source, e.g. "cotton jersey" */
  q: string
  /** At least one of these must appear in the title, type or tags */
  match: string[]
  limit: number
  kind: 'fabric' | 'notion'
}
