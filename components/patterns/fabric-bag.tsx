'use client'

import { IconExternalLink, IconMinus, IconPlus, IconShoppingBag, IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PanelSheet } from '@/components/patterns/panel-sheet'
import { groupBag, removeFromBag, setUnits, type BagItem } from '@/lib/fabric/bag'
import { formatMeters, formatMoney, unitLabel } from '@/lib/fabric/pricing'

/** Top-bar button that opens the bag; shows how many fabrics are in it. */
export function FabricBagButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} aria-label={`Fabric bag, ${count} ${count === 1 ? 'fabric' : 'fabrics'}`}>
      <IconShoppingBag data-icon="inline-start" />
      Bag
      <span className="tabular-nums">{count}</span>
    </Button>
  )
}

/**
 * The fabric bag in a side sheet, grouped by shop. Every shop has its own checkout:
 * Sigrid fills the shop's cart and sends the user there, so card details never pass through Sigrid.
 */
export function FabricBagSheet({ items, open, onOpenChange }: { items: BagItem[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const groups = groupBag(items)

  return (
    <PanelSheet open={open} onOpenChange={onOpenChange} title="Your fabric bag" description="You pay each shop at its own checkout.">

        {groups.length === 0 ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconShoppingBag />
              </EmptyMedia>
              <EmptyTitle>Nothing here yet</EmptyTitle>
              <EmptyDescription>Add a fabric and it will wait here, sorted by shop.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-4 p-4">
              {groups.map((g) => (
                <section key={g.sourceId} aria-label={g.sourceName} className="glass-panel flex flex-col gap-2 rounded-(--radius) border p-3">
                  <header className="flex items-baseline justify-between gap-3">
                    <h3 className="eyebrow !font-medium">{g.sourceName}</h3>
                    <span className="text-sm font-medium tabular-nums">{formatMoney(g.total, g.currency)}</span>
                  </header>

                  <ul className="flex flex-col divide-y">
                    {g.items.map(({ listing, units }) => (
                      <li key={listing.id} className="flex flex-col gap-2 py-2.5 first:pt-1">
                        <div className="flex items-start gap-2">
                          <a href={listing.url} target="_blank" rel="noopener" className="min-w-0 flex-1 text-sm hover:underline hover:underline-offset-4">
                            {listing.title}
                          </a>
                          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${listing.title}`} onClick={() => removeFromBag(listing.id)}>
                            <IconX />
                          </Button>
                        </div>
                        {listing.unitMeters || listing.kind === 'notion' ? (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1" role="group" aria-label={listing.unitMeters ? `Length of ${listing.title}` : `How many ${listing.title}`}>
                              <Button variant="outline" size="icon-sm" aria-label={listing.unitMeters ? 'Shorter' : 'Fewer'} disabled={units <= 1} onClick={() => setUnits(listing.id, units - 1)}>
                                <IconMinus />
                              </Button>
                              <span className="min-w-16 text-center text-sm tabular-nums" aria-live="polite">
                                {listing.unitMeters ? formatMeters(units * listing.unitMeters) : units}
                              </span>
                              <Button variant="outline" size="icon-sm" aria-label={listing.unitMeters ? 'Longer' : 'More'} onClick={() => setUnits(listing.id, units + 1)}>
                                <IconPlus />
                              </Button>
                            </div>
                            <span className="text-right text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                              {formatMoney(units * listing.unitPrice, listing.currency)}
                              {listing.unitMeters && <span className="hidden sm:inline"> · in {unitLabel(listing.unitMeters)} steps</span>}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            One piece{listing.pieceMeters ? `, ${formatMeters(listing.pieceMeters)}` : ''} · {formatMoney(listing.unitPrice, listing.currency)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  {g.cartUrl ? (
                    <Button variant="outline" className="w-full" nativeButton={false} render={<a href={g.cartUrl} target="_blank" rel="noopener" />}>
                      Check out at {g.sourceName}
                      <IconExternalLink data-icon="inline-end" />
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Open each piece to buy it from the seller.</p>
                  )}
                </section>
              ))}
            </div>
          </ScrollArea>
        )}

    </PanelSheet>
  )
}
