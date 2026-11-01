'use client'

import { use, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconArrowRight, IconListCheck, IconPrinter, IconScissors, IconShirt } from '@tabler/icons-react'

import { ActionBar } from '@/components/patterns/action-bar'
import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'
import { Button } from '@/components/ui/button'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentImage } from '@/components/garment/GarmentImage'
import { ProductFrame, ProductGrid } from '@/components/patterns/product-grid'
import { GarmentCard } from '@/components/patterns/garment-card'
import { garmentPhoto } from '@/lib/garment-photos'
import SizeSheet from '@/components/garment/SizeSheet'
import { useMounted } from '@/hooks/use-mounted'
import { usePurchases } from '@/hooks/use-purchases'
import { TOOLS } from '@/components/sewing/tools'
import { catalogGarments, creators, getCatalogItem, getGarmentById, getGuideOutline } from '@/lib/data'
import { BuyDialog } from '@/components/garment/BuyDialog'
import { paymentsEnabled } from '@/lib/payments'
import { getFabricNeed, metersFor } from '@/lib/fabric/needs'
import { formatMeters } from '@/lib/fabric/pricing'
import { loadProject, saveProject, type ProjectState } from '@/lib/projects'
import { loadSavedSize, sizeLabel } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'
import { PhotoLabel } from '@/components/patterns/photo-label'
import { toast } from 'sonner'

export default function GarmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const garment = getGarmentById(id)
  const fabricNeed = getFabricNeed(id)
  const creator = garment.isCreator && garment.creatorId ? creators.find((c) => c.id === garment.creatorId) : null
  // Stable per id: a published pattern's outline is rebuilt from storage on every call
  const guide = useMemo(() => getGuideOutline(id), [id])
  const tools = useMemo(() => (guide ? [...new Set(guide.steps.flatMap((s) => (s.tool ? [s.tool] : [])))] : []), [guide])
  const totalSteps = guide?.steps.length ?? 0

  // Project state lives in the browser, so read it after mount
  const mounted = useMounted()
  // undefined = nothing changed on this page yet, so read what's saved
  const [started, setStarted] = useState<ProjectState | undefined>(undefined)
  const project = started ?? (mounted ? loadProject(id) : null)
  const profileSize = mounted ? loadSavedSize() : null
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false)

  const done = project ? Math.min(project.completedUntil, totalSteps) : 0
  const finished = !!project && totalSteps > 0 && done >= totalSteps
  const inProgress = !!project && !finished

  const enterGuide = () => {
    sessionStorage.setItem('sigrid_flow_enter', '1')
    router.push(`/garment/${id}/guide`)
  }

  const startProject = (size: StandardSize) => {
    if (needsPaying) return
    const next = { size, completedUntil: 0 }
    saveProject(id, next)
    setStarted(next)
    setSizeSheetOpen(false)
    enterGuide()
  }

  const fabricSize = project?.size ?? (profileSize && garment.sizes.includes(profileSize) ? profileSize : null)
  const fabricMeters = metersFor(fabricNeed, fabricSize ?? (garment.sizes.includes('M') ? 'M' : garment.sizes[0]))

  // Every fabric the pattern recommends: "Cotton jersey · Organic cotton jersey · Viscose jersey"
  const fabricNames = fabricNeed.choices.map((c) => c.name).join(' · ')

  // Starting a project is what needs paying for, and the server checks it again before sending the guide
  const purchases = usePurchases()
  const [paying, setPaying] = useState(false)
  const [buyOpen, setBuyOpen] = useState(false)
  const needsPaying = paymentsEnabled && !!getCatalogItem(id) && !purchases.garmentIds.includes(id)

  const buy = () => {
    if (purchases.isSignedIn) setBuyOpen(true)
    else router.push(`/sign-in?redirect_url=${encodeURIComponent(`/garment/${id}`)}`)
  }

  const goToPayment = async () => {
    setPaying(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ garmentId: id, acceptWithdrawalWaiver: true }) })
      if (res.status === 409) {
        // Bought in another tab or on another device
        await purchases.refresh()
        setPaying(false)
        setBuyOpen(false)
        setSizeSheetOpen(true)
        return
      }
      const { url } = (await res.json()) as { url?: string }
      if (!res.ok || !url) throw new Error('No checkout')
      window.location.assign(url)
    } catch {
      setPaying(false)
      toast.error('Checkout couldn’t start. Nothing was charged. Please try again.')
    }
  }

  // Back from Stripe: the server asks Stripe whether this payment is real and this person's.
  // Nothing here is believed from the link alone, and thanks are only said once the money is confirmed.
  const { refresh: refreshPurchases, loading: purchasesLoading } = purchases
  const confirming = useRef(false)
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('checkout_session')
    if (purchasesLoading || !sessionId || confirming.current) return
    confirming.current = true
    fetch(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store', signal: AbortSignal.timeout(20_000) })
      .then((res) => (res.ok ? (res.json() as Promise<{ status: string }>) : Promise.reject(new Error(String(res.status)))))
      .then(async ({ status }) => {
        if (status === 'active') await refreshPurchases()
        router.replace(`/garment/${id}`)
        if (status === 'active') {
          toast.success('Thank you. The pattern is yours.')
          setSizeSheetOpen(true)
        } else if (status === 'processing') {
          toast.info('Your payment is still being processed. The pattern opens here as soon as it clears.', { duration: 10_000 })
        } else {
          toast.error('This payment didn’t go through, so the pattern isn’t unlocked.', { duration: 10_000 })
        }
      })
      .catch(() => {
        // The link stays, so reloading tries again
        confirming.current = false
        toast.error('We couldn’t confirm your payment just now. If you paid, it’s safe. Reload this page in a moment; you won’t be charged again.', { duration: 15_000 })
      })
  }, [purchasesLoading, refreshPurchases, router, id])

  const onCta = () => (needsPaying ? buy() : inProgress ? enterGuide() : setSizeSheetOpen(true))
  const ctaLabel = needsPaying
    ? `Buy pattern · €${garment.price}`
    : inProgress
      ? 'Continue sewing'
      : finished
        ? 'Sew it again'
        : paymentsEnabled && getCatalogItem(id)
          ? 'Start sewing'
          : `Start sewing · €${garment.price}`
  const stepsRow = totalSteps > 0 && (
    <PanelRow
                  leading={<StepDot state={project ? 'active' : 'upcoming'}><IconListCheck className="size-3.5" /></StepDot>}
                  title={project ? (finished ? 'Every step done' : `Next: ${guide!.steps[done]?.title ?? ''}`) : `${totalSteps} steps`}
                  detail={project ? sizeLabel(project.size) : 'Stop after any step, your progress is saved.'}
                />
  )
  // Somewhere to go next: the same maker's other patterns, else something at the same level
  const fromMaker = creator ? catalogGarments.filter((g) => g.creatorId === creator.id && g.id !== id) : []
  const more = (fromMaker.length > 0 ? fromMaker : catalogGarments.filter((g) => g.difficulty === garment.difficulty && g.id !== id)).slice(0, 4)
  const sizeRange = `${garment.sizes[0]}–${garment.sizes[garment.sizes.length - 1]}`

  const printHref = `/garment/${id}/pattern?print=true${project ? `&size=${project.size}` : ''}`

  const cta = (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full" disabled={paying || (paymentsEnabled && !project && purchases.loading)} onClick={onCta}>
        {ctaLabel}
        {inProgress && <IconArrowRight data-icon="inline-end" />}
      </Button>
    </div>
  )

  return (
    <main className="min-h-svh">
      
      <div className="shrink-0 px-4 md:pr-8 md:pl-4">
      <div className="top-bar flex h-14 items-center gap-2">
        <PageBreadcrumbs
          items={[
            { label: 'Explore', href: '/explore' },
            { label: garment.name },
          ]}
        />
      </div>
      </div>

      <div className="md:grid md:grid-cols-12 md:gap-x-(--grid-gutter) md:pr-8 md:pl-4">
        {/* Garment image: a rounded card like the listing tiles. Top of the page on phones; from md it fills the left half top to bottom */}
        <div className="md:sticky md:top-4 md:col-span-6 md:h-[calc(100svh-5rem)] md:self-start">
          <ProductFrame className="mx-4 mt-4 sm:mx-6 md:m-0 md:h-full">
          <GarmentImage
            name={garment.name}
            className="aspect-product rounded-(--image-radius) md:aspect-auto md:h-full"
            sizes="(min-width: 768px) 50vw, 100vw"
            priority
            photoSrc={garment.photo}
          >
            {!garment.photo && garmentPhoto(garment.name) && <PhotoLabel className="absolute bottom-3 left-3 normal-case tracking-normal">Inspiration photo</PhotoLabel>}
          </GarmentImage>
          </ProductFrame>
        </div>

        <div className="flex flex-col md:col-span-6">
          <div className="flex w-full flex-1 flex-col gap-6 px-4 pt-6 pb-6 sm:px-6 md:px-0 md:pt-2">
            <header className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                {/* Smaller than a page hero: it shares the screen with the photo */}
                <h1 className="[--h1-size:clamp(2.25rem,3.4vw,3.5rem)]">{garment.name}</h1>
                <p className="text-xl font-medium tabular-nums">€{garment.price}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {garment.difficulty} · {garment.estimatedTime} · {sizeRange}
              </p>
              {creator && (
                <Link href={`/creator/${creator.id}`} className="flex w-fit items-center gap-2 text-sm underline-offset-4 hover:underline">
                  <CreatorAvatar creator={creator} />
                  {creator.handle}
                </Link>
              )}
              <p className="max-w-prose text-sm text-muted-foreground">{garment.description}</p>
            </header>

            {/* One container: the rows scroll inside it if needed, the main button is always visible at its bottom */}
            <Panel
              glass
              footer={<div className="hidden md:block">{cta}</div>}
              label={finished ? 'Finished' : project ? 'Your project' : 'What you need'}
              meta={project ? `${done} / ${totalSteps}` : undefined}
              progress={project && totalSteps ? (done / totalSteps) * 100 : undefined}
            >
              {project && stepsRow}
              <PanelRow
                href={`/fabric?garment=${id}`}
                leading={<StepDot state="upcoming"><IconShirt className="size-3.5" /></StepDot>}
                title={fabricNames}
                detail={`${formatMeters(fabricMeters)}${fabricSize ? ` for ${sizeLabel(fabricSize)}` : ''} · Find fabric`}
              />
              {tools.length > 0 && (
                <PanelRow
                  leading={<StepDot state="upcoming"><IconScissors className="size-3.5" /></StepDot>}
                  title="Tools"
                  detail={tools.map((t) => TOOLS[t].label.toLowerCase()).join(', ').replace(/^./, (c) => c.toUpperCase())}
                />
              )}
              {guide && guide.pieces > 0 && (
                <PanelRow
                  leading={<StepDot state="upcoming"><IconPrinter className="size-3.5" /></StepDot>}
                  title={`Pattern · ${guide.pieces} pieces`}
                  detail={project ? `Ready to print in ${sizeLabel(project.size)}` : 'Ready once you choose a size'}
                  trailing={
                    project && (
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<a href={printHref} target="_blank" rel="noopener" />}
                      >
                        Print
                      </Button>
                    )
                  }
                />
              )}
              {!project && stepsRow}
            </Panel>

          </div>

          {/* Phones: action stays reachable, just above the tab bar */}
          <ActionBar>{cta}</ActionBar>
        </div>
      </div>

      {more.length > 0 && (
        <div className="px-4 pt-2 pb-44 sm:px-6 md:pt-6 md:pr-8 md:pb-8 md:pl-4">
          <ProductGrid label={fromMaker.length > 0 ? `More from ${creator!.handle}` : 'You might also like'}>
            <div className="tiles">
              {more.map((g) => (
                <GarmentCard key={g.id} href={`/garment/${g.id}`} name={g.name} difficulty={g.difficulty} price={g.price} />
              ))}
            </div>
          </ProductGrid>
        </div>
      )}

      <SizeSheet
        garment={garment}
        open={sizeSheetOpen}
        onClose={() => setSizeSheetOpen(false)}
        initialSize={project?.size ?? profileSize}
        onConfirm={startProject}
      />
      <BuyDialog open={buyOpen} name={garment.name} price={garment.price} busy={paying} onOpenChange={setBuyOpen} onConfirm={goToPayment} />
    </main>
  )
}
