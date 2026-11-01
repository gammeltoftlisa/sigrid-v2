'use client'

import type { FacetId } from '@/lib/shop/taxonomy'
import type { ShopFacet } from '@/lib/shop/types'

import { FilterDropdown, PriceDropdown } from './filter-dropdown'

/** The filters for what's showing, each one a dropdown: price first, then what fits this category. */
export function ShopFilters({
  facets,
  chosen,
  onChoose,
  price,
  priceValue,
  priceLabel,
  onPrice,
}: {
  facets: ShopFacet[]
  chosen: Partial<Record<FacetId, string[]>>
  onChoose: (facet: FacetId, values: string[]) => void
  price: { min: number; max: number } | null
  priceValue: { min: number; max: number } | null
  priceLabel: string
  onPrice: (price: { min: number; max: number } | null) => void
}) {
  return (
    <>
      {price && <PriceDropdown label={priceLabel} bounds={price} value={priceValue} onChange={onPrice} per={priceLabel === 'Price' ? '' : 'per metre'} />}
      {facets.map((f) => (
        <FilterDropdown key={f.id} label={f.label} options={f.options} value={chosen[f.id] ?? []} onChange={(v) => onChoose(f.id, v)} />
      ))}
    </>
  )
}
