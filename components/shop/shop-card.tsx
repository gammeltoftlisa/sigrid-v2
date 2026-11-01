'use client'

import { useState } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FabricCard } from '@/components/patterns/fabric-card'
import type { FabricListing } from '@/lib/fabric/types'
import type { FacetId } from '@/lib/shop/taxonomy'
import type { ShopItem, ShopVariant } from '@/lib/shop/types'

const VARIANT_FACETS = new Set<FacetId>(['colour', 'length', 'size', 'width'])

/** The one a filter asked for, when there's a filter that says: choosing blue shows the blue zip */
function bestVariant(item: ShopItem, filters: Partial<Record<FacetId, string[]>>): ShopVariant | undefined {
  const variants = item.variants
  if (!variants?.length) return undefined
  const wanted = (Object.entries(filters) as [FacetId, string[]][]).filter(([id, v]) => v?.length && VARIANT_FACETS.has(id))
  const says = (v: ShopVariant, id: FacetId, values: string[]) => values.some((w) => v.facets?.[id]?.includes(w))
  // One that says it's what you asked for, else one that at least doesn't say it isn't
  return (
    variants.find((v) => wanted.length > 0 && wanted.every(([id, values]) => says(v, id, values))) ??
    variants.find((v) => wanted.every(([id, values]) => !v.facets?.[id] || says(v, id, values))) ??
    variants[0]
  )
}

/** Exactly what goes in the bag: the product, in the chosen variant */
function asListing(item: ShopItem, variant?: ShopVariant): FabricListing {
  const listing: FabricListing = {
    id: item.id,
    kind: item.kind,
    sourceId: item.sourceId,
    sourceName: item.sourceName,
    title: item.title,
    url: item.url,
    image: item.image,
    condition: item.condition,
    currency: item.currency,
    unitPrice: item.unitPrice,
    unitMeters: item.unitMeters,
    composition: item.composition,
    widthCm: item.widthCm,
    shipsFrom: item.shipsFrom,
    available: item.available,
    checkout: item.checkout,
  }
  if (!variant) return listing
  return {
    ...listing,
    id: `${item.id}:${variant.id}`,
    title: `${item.title} – ${variant.label}`,
    unitPrice: variant.price,
    image: variant.image ?? item.image,
    checkout: item.checkout.kind === 'shopify-cart' ? { ...item.checkout, variantId: variant.id } : item.checkout,
  }
}

/** A product in the store. When it comes in several sizes or colours, you choose here, since the bag holds one exact thing. */
export function ShopCard({
  item,
  filters,
  inBag,
  onToggleBag,
  eager,
}: {
  item: ShopItem
  filters: Partial<Record<FacetId, string[]>>
  inBag: (id: string) => boolean
  onToggleBag: (listing: FabricListing) => void
  eager?: boolean
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const variant = item.variants?.find((v) => v.id === picked) ?? bestVariant(item, filters)
  const listing = asListing(item, variant)
  // The card's name stays the product's; only the bag needs the variant in it
  const shown = { ...listing, title: item.title, id: item.id }

  return (
    <FabricCard listing={shown} eager={eager} priceUnit={item.priceUnit} inBag={inBag(listing.id)} onToggleBag={() => onToggleBag(listing)}>
      {item.variants && variant && (
        <div className="relative z-10 mt-2">
          <Select
            items={item.variants.map((v) => ({ value: String(v.id), label: v.label }))}
            value={String(variant.id)}
            onValueChange={(v) => setPicked(Number(v))}
          >
            <SelectTrigger size="sm" aria-label={`Choose ${item.title}`} className="w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {item.variants.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </FabricCard>
  )
}
