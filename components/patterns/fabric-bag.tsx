'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconExternalLink, IconMinus, IconPhotoOff, IconPlus, IconShoppingBag, IconX } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PanelSheet } from '@/components/patterns/panel-sheet'
import { catalogGarments } from '@/lib/data'
import { groupBag, removeFromBag, restoreToBag, setUnits, type BagGroup, type BagItem } from '@/lib/fabric/bag'
import { formatMeters, formatMoney, unitLabel } from '@/lib/fabric/pricing'
import { productHref } from '@/lib/shop/href'

/** Top-bar button that opens the bag; shows how many things are in it. */
export function FabricBagButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <Button variant="outline" size="lg" onClick={onClick} aria-label={`Bag, ${count} ${count === 1 ? 'thing' : 'things'}`}>
      <IconShoppingBag data-icon="inline-start" />
      <span className="max-sm:sr-only">Bag</span>
      <span className="tabular-nums">{count}</span>
    </Button>
  )
}

const garmentName = (id: string) => catalogGarments.find((g) => g.id === id)?.name

/** Older bags saved the colour in the name: "Washed linen – Rust" */
const nameOf = ({ title, variant }: BagItem['listing']) => (variant && title.endsWith(` – ${variant}`) ? title.slice(0, -variant.length - 3) : title)

/** One thing in the bag: its photo and name lead to its page, then how much and what it costs */
function BagLine({ item, index, onOpenProduct }: { item: BagItem; index: number; onOpenProduct: () => void }) {
  const { listing, units, garmentId } = item
  const name = nameOf(listing)
  // Things from the store have their own page in Sigrid; anything else opens at the seller
  const inApp = !garmentId ? productHref(listing) : null
  const forPattern = garmentId ? garmentName(garmentId) : undefined
  const unitPrice = listing.unitMeters
    ? `${formatMoney(listing.unitPrice, listing.currency)} per ${unitLabel(listing.unitMeters)}`
    : listing.kind === 'notion'
      ? `${formatMoney(listing.unitPrice, listing.currency)} each`
      : `One piece${listing.pieceMeters ? `, ${formatMeters(listing.pieceMeters)}` : ''}`
  const adjustable = !!listing.unitMeters || listing.kind === 'notion'

  const remove = () => {
    removeFromBag(listing.id)
    toast(`Removed ${name} from your bag`, { action: { label: 'Undo', onClick: () => restoreToBag(item, index) } })
  }

  const go = (children: React.ReactNode, className: string, decorative?: boolean) =>
    inApp ? (
      <Link href={inApp} onClick={onOpenProduct} className={className} {...(decorative && { tabIndex: -1, 'aria-hidden': true })}>
        {children}
      </Link>
    ) : (
      <a href={listing.url} target="_blank" rel="noopener" className={className} {...(decorative && { tabIndex: -1, 'aria-hidden': true })}>
        {children}
        {!decorative && <span className="sr-only"> (opens {listing.sourceName} in a new tab)</span>}
      </a>
    )

  return (
    <li className="flex gap-3 py-3">
      {go(
        listing.image ? (
          <Image src={listing.image} alt="" fill sizes="64px" className="object-cover hover-zoom" />
        ) : (
          <IconPhotoOff className="absolute inset-0 m-auto size-5 text-muted-foreground" stroke={1.5} />
        ),
        'relative aspect-product w-16 shrink-0 self-start overflow-hidden rounded-(--control-radius) bg-muted',
        true,
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {go(name, 'line-clamp-2 text-sm font-medium underline-offset-4 hover:underline')}
            <p className="text-xs text-muted-foreground tabular-nums">{[listing.variant, unitPrice].filter(Boolean).join(' · ')}</p>
            {forPattern && <p className="text-xs text-muted-foreground">For {forPattern}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${name}`} onClick={remove}>
            <IconX />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          {adjustable ? (
            <div className="flex items-center gap-1" role="group" aria-label={listing.unitMeters ? `Length of ${name}` : `How many ${name}`}>
              <Button variant="outline" size="icon-sm" aria-label={listing.unitMeters ? `Shorter, by ${unitLabel(listing.unitMeters)}` : 'One fewer'} disabled={units <= 1} onClick={() => setUnits(listing.id, units - 1)}>
                <IconMinus />
              </Button>
              <span className="min-w-14 text-center text-sm tabular-nums" aria-live="polite">
                {listing.unitMeters ? formatMeters(units * listing.unitMeters) : units}
              </span>
              <Button variant="outline" size="icon-sm" aria-label={listing.unitMeters ? `Longer, by ${unitLabel(listing.unitMeters)}` : 'One more'} onClick={() => setUnits(listing.id, units + 1)}>
                <IconPlus />
              </Button>
            </div>
          ) : (
            <span />
          )}
          <span className="text-sm tabular-nums">{formatMoney(units * listing.unitPrice, listing.currency)}</span>
        </div>
      </div>
    </li>
  )
}

/** One shop's part of the bag, with the way to its own checkout */
function ShopGroup({ group, only, positions, onOpenProduct }: { group: BagGroup; only: boolean; positions: Map<string, number>; onOpenProduct: () => void }) {
  const count = group.items.length
  return (
    <section aria-label={group.sourceName} className="glass-panel flex flex-col rounded-(--radius) border">
      <header className="container-head flex items-baseline justify-between gap-3">
        <h3 className="eyebrow text-muted-foreground">{group.sourceName}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {count} {count === 1 ? 'thing' : 'things'}
        </span>
      </header>

      <ul className="flex flex-col divide-y px-3">
        {group.items.map((item) => (
          <BagLine key={item.listing.id} item={item} index={positions.get(item.listing.id) ?? 0} onOpenProduct={onOpenProduct} />
        ))}
      </ul>

      <footer className="flex flex-col gap-2 border-t p-3">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span>Subtotal</span>
          <span className="font-medium tabular-nums">{formatMoney(group.total, group.currency)}</span>
        </div>
        {/* One shop: checking out is the sheet's one main action. Several: equal choices, so none outranks the others */}
        {group.cartUrl ? (
          <>
            <Button size={only ? 'lg' : 'default'} variant={only ? 'default' : 'outline'} className="w-full" nativeButton={false} render={<a href={group.cartUrl} target="_blank" rel="noopener" />}>
              Check out at {group.sourceName}
              <IconExternalLink data-icon="inline-end" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">Opens their basket with these in it, in a new tab.</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Open each piece to buy it from the seller.</p>
        )}
      </footer>
    </section>
  )
}

/**
 * The bag in a side sheet, grouped by shop. Every shop has its own checkout:
 * Sigrid fills the shop's cart and sends the user there, so card details never pass through Sigrid.
 * Each line shows its photo, and leads to its page in the store.
 */
export function FabricBagSheet({ items, open, onOpenChange }: { items: BagItem[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const groups = groupBag(items)
  const positions = new Map(items.map((i, n) => [i.listing.id, n]))
  const close = () => onOpenChange(false)

  // Totals can only be added up within one currency
  const totals = new Map<string, number>()
  for (const g of groups) totals.set(g.currency, (totals.get(g.currency) ?? 0) + g.total)
  const total = [...totals].map(([currency, sum]) => formatMoney(sum, currency)).join(' + ')

  const summary =
    groups.length > 0 ? (
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm">
            {items.length} {items.length === 1 ? 'thing' : 'things'}
            {groups.length > 1 && ` from ${groups.length} shops`}
          </span>
          <span className="title-sm tabular-nums">{total}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {groups.length > 1 ? 'Each shop has its own checkout and delivery, so you pay them one at a time.' : 'Delivery is added at the shop’s checkout.'} Your bag
          stays on this device until you empty it.
        </p>
      </div>
    ) : undefined

  return (
    <PanelSheet open={open} onOpenChange={onOpenChange} title="Your bag" description="You pay each shop at its own checkout, so your card never passes through Sigrid." footer={summary}>
      {groups.length === 0 ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconShoppingBag />
            </EmptyMedia>
            <EmptyTitle>Nothing here yet</EmptyTitle>
            <EmptyDescription>Add fabric, thread or anything else from the shop and it waits here, sorted by shop.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" nativeButton={false} render={<Link href="/fabric" onClick={close} />}>
              Go to the shop
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 p-4 pt-0">
            {groups.map((g) => (
              <ShopGroup key={g.key} group={g} only={groups.length === 1} positions={positions} onOpenProduct={close} />
            ))}
          </div>
        </ScrollArea>
      )}
    </PanelSheet>
  )
}
