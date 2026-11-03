'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconCheck, IconExternalLink, IconPlus, IconTruck } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GarmentGallery } from '@/components/garment/GarmentGallery'
import { ActionBar } from '@/components/patterns/action-bar'
import { ChipGroup } from '@/components/patterns/chip-group'
import { DetailList } from '@/components/patterns/detail-list'
import { FabricBagButton, FabricBagSheet } from '@/components/patterns/fabric-bag'
import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'
import { PhotoLabel } from '@/components/patterns/photo-label'
import { ProductFrame, ProductGrid } from '@/components/patterns/product-grid'
import { StatusMessage } from '@/components/patterns/status-message'
import { formatMoney, pricePerMeter, unitLabel } from '@/lib/fabric/pricing'
import type { AboutBlock } from '@/lib/shop/product'
import { getCategory, subLabel } from '@/lib/shop/taxonomy'
import type { ShopItem } from '@/lib/shop/types'

import { asListing } from './shop-card'
import { ShopCard } from './shop-card'
import { useShopBag } from './shop-page'

const baseOf = (src: string) => src.split('?')[0]

/** Few short choices sit in a row of chips; anything more is a dropdown */
const fitsInARow = (labels: string[]) => labels.length <= 5 && labels.every((l) => l.length <= 14)

/**
 * A product's own page, built like a pattern's: its photos on one side, everything about it on the other.
 * The photos swipe; choosing a colour turns to that colour's photo. The bag holds one exact thing,
 * so a product with variants is added in the one chosen here.
 */
export function ShopProduct({
  item,
  photos,
  about,
  facts,
  optionName,
  available,
  partial,
  more,
  initialVariant,
}: {
  item: ShopItem
  photos: string[]
  about: AboutBlock[]
  facts: { label: string; value: string }[]
  optionName?: string
  available: boolean
  partial: boolean
  more: ShopItem[]
  initialVariant?: number
}) {
  const router = useRouter()
  const { bag, bagOpen, setBagOpen, inBag, toggleBag } = useShopBag()
  const [picked, setPicked] = useState<number | undefined>(() => item.variants?.find((v) => v.id === initialVariant)?.id)
  const variant = item.variants?.find((v) => v.id === picked) ?? item.variants?.[0]
  const listing = asListing(item, variant)
  const has = inBag.has(listing.id)
  const choiceId = useId()

  const category = getCategory(item.category)
  const tag = item.condition === 'new' ? null : item.condition === 'deadstock' ? 'Deadstock' : 'Secondhand'
  // The chosen variant's own photo, when it has one
  const showPhoto = variant?.image ? photos.findIndex((p) => baseOf(p) === baseOf(variant.image!)) : -1

  const perMetre = pricePerMeter(listing)
  const price =
    perMetre !== null ? (
      <>
        {formatMoney(perMetre, listing.currency)}
        <span className="text-muted-foreground"> / m</span>
      </>
    ) : (
      <>
        {formatMoney(listing.unitPrice, listing.currency)}
        {item.priceUnit && <span className="text-muted-foreground"> {item.priceUnit}</span>}
      </>
    )
  const meta = [category && subLabel(category, item.sub), item.composition, item.widthCm && `${item.widthCm} cm wide`].filter(Boolean).join(' · ')

  const choices = item.variants?.map((v) => ({ value: String(v.id), label: v.label })) ?? []
  const choiceLabel = optionName ?? 'Choose one'

  const cta = (
    <div className="flex flex-col gap-2">
      {has ? (
        <>
          <Button size="lg" className="w-full" onClick={() => setBagOpen(true)}>
            <IconCheck data-icon="inline-start" />
            In your bag · View bag
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => toggleBag(listing)}>
            Remove from bag
          </Button>
        </>
      ) : (
        <Button size="lg" className="w-full" disabled={!available} onClick={() => toggleBag(listing)}>
          {available && <IconPlus data-icon="inline-start" />}
          {available ? 'Add to bag' : 'Sold out at the shop'}
        </Button>
      )}
      <p className="text-center text-xs text-muted-foreground">
        {listing.unitMeters
          ? `Goes in as 1 m. Change the length in your bag, in steps of ${unitLabel(listing.unitMeters)}.`
          : `You pay ${item.sourceName} at their own checkout.`}
      </p>
    </div>
  )

  return (
    <div className="min-h-svh pb-44 md:pb-(--page-bottom)">
      <div className="shrink-0 px-4 pt-(--page-top) md:px-3">
        <div className="top-bar flex items-center justify-between gap-2">
          <PageBreadcrumbs
            items={[
              { label: 'Shop', href: '/fabric' },
              // The subcategory says enough ("Linens"), and the name keeps its room on a phone
              ...(category ? [{ label: subLabel(category, item.sub), href: `/fabric?category=${category.id}&sub=${encodeURIComponent(item.sub)}` }] : []),
              { label: item.title },
            ]}
          />
          <FabricBagButton count={bag.length} onClick={() => setBagOpen(true)} />
        </div>
      </div>

      <div className="md:grid md:grid-cols-12 md:gap-x-(--grid-gutter) md:px-3">
        {/* The photos, swipeable when there are several. Both columns are sticky: the shorter stays in view */}
        <div className="garment-photo-pane md:sticky md:top-4 md:col-span-6 md:self-start">
          <ProductFrame className="mx-4 mt-1 sm:mx-6 md:m-0 md:h-full">
            <GarmentGallery
              name={item.title}
              className="aspect-product rounded-(--image-radius) md:aspect-auto md:h-full"
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
              photoSrc={photos[0] ?? null}
              photos={photos}
              show={showPhoto >= 0 ? showPhoto : undefined}
            >
              {tag && <PhotoLabel className="absolute top-3 left-3">{tag}</PhotoLabel>}
            </GarmentGallery>
          </ProductFrame>
        </div>

        <div className="flex flex-col md:sticky md:top-4 md:col-span-6 md:self-start">
          <div className="flex w-full flex-col gap-3 px-4 pt-3 pb-3 sm:px-6 md:px-0 md:pt-0 md:pb-0">
            <header className="flex flex-col gap-2">
              <p className="eyebrow text-muted-foreground">{item.sourceName}</p>
              <h1 className="title-compact">{item.title}</h1>
              <p className="title-md tabular-nums">{price}</p>
              {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
            </header>

            {partial && (
              <StatusMessage
                status="info"
                title={`${item.sourceName} didn’t answer just now`}
                action={<Button size="sm" variant="outline" onClick={() => router.refresh()}>Try again</Button>}
              >
                So this is the shop’s copy from this morning: one photo and no description. Prices may have changed.
              </StatusMessage>
            )}

            {/* Everything you act on, in one glass panel: the choice, the shop, the main button */}
            <Panel glass label="Buy" footer={<div className="hidden md:block">{cta}</div>}>
              {item.variants && variant && (
                <div className="flex flex-col gap-2 pb-1">
                  {fitsInARow(choices.map((c) => c.label)) ? (
                    <>
                      <p className="text-xs font-medium">{choiceLabel}</p>
                      <ChipGroup
                        label={choiceLabel}
                        options={choices}
                        value={[String(variant.id)]}
                        onValueChange={(v) => setPicked(Number(v[0]))}
                      />
                    </>
                  ) : (
                    <Field>
                      <FieldLabel htmlFor={choiceId}>{choiceLabel}</FieldLabel>
                      <Select items={choices} value={String(variant.id)} onValueChange={(v) => setPicked(Number(v))}>
                        <SelectTrigger id={choiceId} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {choices.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </div>
              )}
              <PanelRow
                href={item.url}
                external
                leading={<StepDot state="upcoming"><IconExternalLink className="size-3.5" /></StepDot>}
                title={`See it at ${item.sourceName}`}
                detail="Their own page, in a new tab"
              />
              <PanelRow
                leading={<StepDot state="upcoming"><IconTruck className="size-3.5" /></StepDot>}
                title={`Ships from ${facts.find((f) => f.label === 'Ships from')?.value ?? item.shipsFrom}`}
                detail={`Delivery and returns are ${item.sourceName}’s`}
              />
            </Panel>

            <Panel label="Details">
              <DetailList items={facts} />
            </Panel>

            {about.length > 0 && (
              <Panel label="About it" meta={`From ${item.sourceName}`}>
                <div className="flex max-w-prose flex-col gap-3 rounded-(--control-radius) bg-card p-4 text-sm">
                  {about.map((block, i) =>
                    block.kind === 'p' ? (
                      <p key={i}>{block.text}</p>
                    ) : (
                      <ul key={i} className="flex list-disc flex-col gap-1 pl-5">
                        {block.items.map((li, j) => (
                          <li key={j}>{li}</li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </Panel>
            )}
          </div>

          {/* Phones: the main action stays reachable, just above the tab bar */}
          <ActionBar>{cta}</ActionBar>
        </div>
      </div>

      {more.length > 0 && (
        <div className="px-4 sm:px-6 md:px-3 md:pt-(--section-gap)">
          <ProductGrid label={`More ${category ? subLabel(category, item.sub).toLowerCase() : 'like this'}`}>
            <div className="tiles">
              {more.map((m) => (
                <ShopCard key={m.id} item={m} filters={{}} inBag={(id) => inBag.has(id)} onToggleBag={toggleBag} />
              ))}
            </div>
          </ProductGrid>
        </div>
      )}

      <FabricBagSheet items={bag} open={bagOpen} onOpenChange={setBagOpen} />
    </div>
  )
}
