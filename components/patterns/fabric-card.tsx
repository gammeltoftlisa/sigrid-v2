import Image from 'next/image'
import Link from 'next/link'
import { IconCheck, IconPlus, IconShirt } from '@tabler/icons-react'
import { cn } from 'cn'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/patterns/status-badge'
import { coversLength, formatMeters, formatMoney, pricePerMeter, unitsFor } from '@/lib/fabric/pricing'
import type { FabricCondition, FabricListing } from '@/lib/fabric/types'
import { PhotoLabel } from '@/components/patterns/photo-label'

const conditionTag: Record<FabricCondition, string | null> = {
  new: null,
  deadstock: 'Deadstock',
  secondhand: 'Secondhand',
}

/**
 * A fabric (or notion) for sale, styled like a store tile: photo, shop, name, fibre and width,
 * then one price: for the length your size needs, or per metre when browsing. The name links to the product's
 * page in Sigrid when there is one (`href`), else to the shop's own page.
 */
export function FabricCard({
  listing,
  meters,
  size,
  inBag,
  onToggleBag,
  eager,
  priceUnit,
  href,
  children,
  className,
}: {
  listing: FabricListing
  /** Metres needed for the chosen garment and size; leave out when browsing the store */
  meters?: number
  /** Short size name for the length check, e.g. "M" */
  size?: string
  inBag: boolean
  onToggleBag: () => void
  /** Load the photo right away: for the first row, which is usually the largest paint */
  eager?: boolean
  /** "per metre" and the like, for supplies the shop sells by length */
  priceUnit?: string
  /** The product's own page in Sigrid. Without it, the name opens the shop's page in a new tab. */
  href?: string
  /** A choice under the price, such as a zip's length */
  children?: React.ReactNode
  className?: string
}) {
  const tag = conditionTag[listing.condition]
  const perMeter = pricePerMeter(listing)
  const units = meters ? unitsFor(listing, meters) : 0
  const covers = meters ? coversLength(listing, meters) : null

  return (
    <Card data-variant="product" className={cn('group/tile relative gap-3 pt-0', className)}>
      <div className="product-image relative aspect-product overflow-hidden bg-muted">
        {listing.image ? (
          <Image
            src={listing.image}
            alt=""
            fill
            loading={eager ? 'eager' : 'lazy'}
            sizes="(min-width: 1536px) 20vw, (min-width: 768px) 30vw, 50vw"
            className="object-cover hover-zoom"
          />
        ) : (
          <IconShirt className="absolute inset-0 m-auto size-8 text-muted-foreground" aria-hidden />
        )}
        {tag && <PhotoLabel className="absolute top-3 left-3">{tag}</PhotoLabel>}
        <button
          type="button"
          aria-pressed={inBag}
          onClick={onToggleBag}
          className={cn(
            'glass-chip absolute right-3 bottom-3 z-10 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium outline-none transition-transform press pointer-coarse:h-10',
            inBag && 'bg-foreground! bg-none! text-background!',
          )}
        >
          {inBag ? <IconCheck className="size-4" aria-hidden /> : <IconPlus className="size-4" aria-hidden />}
          {inBag ? 'In bag' : 'Add'}
          <span className="sr-only"> {listing.title} {inBag ? '(remove from your bag)' : 'to your bag'}</span>
        </button>
      </div>

      <CardHeader className="gap-0.5">
        <p className="eyebrow mb-0.5 truncate text-muted-foreground">{listing.sourceName}</p>
        <CardTitle className="line-clamp-2">
          {href ? (
            <Link href={href} className="outline-none after:absolute after:inset-0">
              {listing.title}
            </Link>
          ) : (
            <a href={listing.url} target="_blank" rel="noopener" className="outline-none after:absolute after:inset-0">
              {listing.title}
              <span className="sr-only"> (opens {listing.sourceName} in a new tab)</span>
            </a>
          )}
        </CardTitle>
        {listing.composition && <p className="line-clamp-1 text-xs text-muted-foreground">{listing.composition}</p>}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-col items-start gap-2 text-sm tabular-nums">
          {listing.kind === 'notion' ? (
            <span>
              {formatMoney(listing.unitPrice, listing.currency)}
              {priceUnit && <span className="text-muted-foreground"> {priceUnit}</span>}
            </span>
          ) : perMeter !== null && meters ? (
            <span>
              {formatMoney(units * listing.unitPrice, listing.currency)}
              <span className="text-muted-foreground"> for {formatMeters(units * listing.unitMeters!)}</span>
            </span>
          ) : perMeter !== null ? (
            <span>
              {formatMoney(perMeter, listing.currency)}
              <span className="text-muted-foreground"> / m</span>
            </span>
          ) : (
            <span>
              {formatMoney(listing.unitPrice, listing.currency)}
              <span className="text-muted-foreground">{listing.pieceMeters ? ` for ${formatMeters(listing.pieceMeters)}` : ''}</span>
            </span>
          )}
          {meters && covers === false && <StatusBadge status="warning">Too short for {size}</StatusBadge>}
        </div>
        {children}

      </CardContent>
    </Card>
  )
}
