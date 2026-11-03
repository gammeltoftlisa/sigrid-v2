'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconCheck } from '@tabler/icons-react'

import { CheckoutForm } from '@/components/garment/checkout-form'
import { GarmentImage } from '@/components/garment/GarmentImage'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel } from '@/components/patterns/panel'
import { usePurchases } from '@/hooks/use-purchases'
import { creators, getCatalogItem, getGarmentById, getGuideOutline } from '@/lib/data'
import { pricesIncludeVat } from '@/lib/legal'
import { paymentsEnabled } from '@/lib/payments'

/** What one payment gets you. Kept to what is true for every pattern. */
const included = ['The pattern in your size, to print', 'A step-by-step sewing guide', 'Yours to keep, no subscription']

/**
 * Checkout for one pattern: what you're buying on one side, paying on the other. Nothing else on the
 * page competes with it. Patterns that are free, owned or not ready go back to their own page.
 */
export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const garment = getGarmentById(id)
  const creator = garment.creatorId ? creators.find((c) => c.id === garment.creatorId) : null
  const purchases = usePurchases()
  const owned = purchases.garmentIds.includes(id)
  const sellable = paymentsEnabled && !!getCatalogItem(id) && !!getGuideOutline(id)?.steps.length

  useEffect(() => {
    if (!sellable || owned) router.replace(`/garment/${id}`)
  }, [sellable, owned, router, id])

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        breadcrumbs={[{ label: garment.name, href: `/garment/${id}` }, { label: 'Checkout' }]}
        title={<>Almost <em className="display-italic">yours</em></>}
        compact
      />

      <div className="grid gap-(--grid-gutter) md:grid-cols-12 md:items-start">
        {/* What you're buying. First on phones, beside the payment from md, and it stays in view */}
        <div className="md:sticky md:top-4 md:order-last md:col-span-5">
          <Panel label="Your order">
            <div className="flex items-center gap-3 px-1">
              <GarmentImage name={garment.name} photoSrc={garment.photo} sizes="80px" className="aspect-product w-16 shrink-0 rounded-(--control-radius)" />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="title-sm truncate">{garment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {creator ? `${creator.handle} · ` : ''}
                  {garment.difficulty}
                </p>
              </div>
            </div>
            {/* Phones keep the order short, so paying is right there */}
            <ul className="hidden flex-col gap-2 rounded-(--control-radius) bg-card p-3 text-sm md:flex">
              {included.map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <IconCheck aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between gap-3 px-1 pt-1">
              <span className="text-sm">Total</span>
              <span className="title-md tabular-nums">€{garment.price}</span>
            </div>
            <p className="px-1 text-xs text-muted-foreground">{pricesIncludeVat ? 'One payment, in euros, including VAT.' : 'One payment, in euros.'}</p>
          </Panel>
        </div>

        <div className="md:col-span-7">{sellable && !owned && <CheckoutForm garmentId={id} price={garment.price} />}</div>
      </div>
    </PageContainer>
  )
}
