import type { FabricListing } from '../fabric/types'

import type { Facets } from './classify'
import type { CategoryId, ColourName, FacetId } from './taxonomy'

/** One way a product is sold: a zip's length, a button's size, a ribbon's colour */
export interface ShopVariant {
  id: number
  label: string
  price: number
  image?: string
  /** What's true of this one only, so a filter can pick the right one */
  facets?: Facets
}

/** A product in the store: everything a card and the bag need, and what it can be filtered on */
export interface ShopItem extends FabricListing {
  category: CategoryId
  /** Its bubble inside the category, by name */
  sub: string
  facets: Facets
  /** "per metre" and the like, for supplies the shop sells by length */
  priceUnit?: string
  /** Only when there's a real choice: two or more */
  variants?: ShopVariant[]
  /** Rough price in euros, to filter and sort across currencies. Per metre for what's sold by length. */
  eur: number
  /** When the shop first listed it: its own feed's date, for "Newest" */
  createdAt?: string
  /** Its place in the shop's own feed, which is how the shop itself orders things */
  rank: number
}

export type ShopSort = 'featured' | 'newest' | 'price-asc' | 'price-desc'

export interface ShopQuery {
  category?: CategoryId
  sub?: string
  q?: string
  filters: Partial<Record<FacetId, string[]>>
  price?: { min: number; max: number }
  sort: ShopSort
  page: number
}

export interface FacetOption {
  value: string
  count: number
  /** For colours: the swatch */
  hex?: string
}

export interface ShopFacet {
  id: FacetId
  label: string
  options: FacetOption[]
}

export interface CategorySummary {
  id: CategoryId
  name: string
  count: number
}

export interface SubcategorySummary {
  name: string
  count: number
}

/** One category on the way into the store: a first look at it */
export interface ShopRow {
  category: CategorySummary
  items: ShopItem[]
}

/** The way into the store: every category with products, row by row */
export interface ShopRowsResponse {
  rows: ShopRow[]
  categories: CategorySummary[]
  refreshedAt: string | null
}

export interface ShopResponse {
  items: ShopItem[]
  total: number
  page: number
  pageSize: number
  facets: ShopFacet[]
  /** Lowest and highest price in the results, ignoring the price filter itself. In whole euros. */
  price: { min: number; max: number } | null
  categories: CategorySummary[]
  /** The bubbles inside the current category */
  subs: SubcategorySummary[]
  /** Which shops are in the catalogue, and when it was last refreshed */
  refreshedAt: string | null
}

export type { ColourName }
