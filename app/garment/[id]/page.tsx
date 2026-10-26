'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconArrowRight, IconCheck, IconListCheck, IconPlus, IconPrinter, IconScissors, IconShirt } from '@tabler/icons-react'

import { ActionBar } from '@/components/patterns/action-bar'
import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'
import { Button } from '@/components/ui/button'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentImage } from '@/components/garment/GarmentArt'
import SizeSheet from '@/components/garment/SizeSheet'
import { useMounted } from '@/hooks/use-mounted'
import { TOOLS } from '@/components/sewing/tools'
import { creators, getGarmentById, getGarmentGuide } from '@/lib/data'
import { getFabricNeed, metersFor } from '@/lib/fabric/needs'
import { formatMeters } from '@/lib/fabric/pricing'
import { loadProject, saveProject, type ProjectState } from '@/lib/projects'
import { loadSavedSize, sizeLabel } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'
import { PhotoLabel } from '@/components/patterns/photo-label'

export default function GarmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const garment = getGarmentById(id)
  const fabricNeed = getFabricNeed(id)
  const creator = garment.isCreator && garment.creatorId ? creators.find((c) => c.id === garment.creatorId) : null
  const [following, setFollowing] = useState(false)
  // Stable per id: a published pattern's guide is rebuilt from storage on every call
  const guide = useMemo(() => getGarmentGuide(id), [id])
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

  const onCta = () => (inProgress ? enterGuide() : setSizeSheetOpen(true))
  const ctaLabel = inProgress ? 'Continue sewing' : finished ? 'Sew it again' : `Start sewing · €${garment.price}`
  const sizeRange = `${garment.sizes[0]}–${garment.sizes[garment.sizes.length - 1]}`

  const printHref = `/garment/${id}/pattern?print=true${project ? `&size=${project.size}` : ''}`

  const cta = (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full" onClick={onCta}>
        {ctaLabel}
        {inProgress && <IconArrowRight data-icon="inline-end" />}
      </Button>
    </div>
  )

  return (
    <main className="min-h-svh md:flex md:h-svh md:flex-col md:overflow-hidden">
      {/* Breadcrumbs: always visible; on md+ the page itself never scrolls, only the details panel does */}
      <div className="shrink-0 px-4 md:pr-8 md:pl-4">
      <div className="top-bar flex h-14 items-center gap-2">
        <PageBreadcrumbs
          items={[
            { label: 'Home', href: '/home' },
            ...(garment.isCreator || garment.published ? [{ label: 'Explore', href: '/explore' }] : []),
            { label: garment.name },
          ]}
        />
      </div>
      </div>

      <div className="md:grid md:min-h-0 md:flex-1 md:grid-cols-12 md:gap-x-(--grid-gutter) md:pr-8 md:pl-4">
        {/* Garment image: a rounded card like the listing tiles. Top of the page on phones; from md it fills the left half top to bottom */}
        <div className="md:col-span-6 md:h-full md:min-h-0 md:pb-6">
          <GarmentImage
            name={garment.name}
            className="mx-4 mt-4 aspect-product rounded-(--radius) sm:mx-6 md:m-0 md:aspect-auto md:h-full"
            artClassName="max-w-72 md:max-w-sm"
            sizes="(min-width: 768px) 50vw, 100vw"
            priority
            photoSrc={garment.photo}
          >
            {!garment.photo && <PhotoLabel className="absolute bottom-3 left-3 normal-case tracking-normal">Inspiration photo · Unsplash</PhotoLabel>}
          </GarmentImage>
        </div>

        <div className="flex flex-col md:col-span-6 md:min-h-0 md:pb-6">
          <div className="flex w-full flex-1 flex-col gap-6 px-4 pt-6 pb-44 sm:px-6 md:min-h-0 md:px-0 md:pt-2 md:pb-0">
            <header className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                {/* Smaller than a page hero: it shares the screen with the photo */}
                <h1 className="[--h1-size:clamp(2.25rem,3.4vw,3.5rem)]">{garment.name}</h1>
                <p className="text-xl font-medium tabular-nums">€{garment.price}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {garment.difficulty} · {garment.estimatedTime} · {sizeRange}
              </p>
              <p className="max-w-prose text-sm text-muted-foreground">{garment.description}</p>
            </header>

            {/* One container: the rows scroll inside it if needed, the main button is always visible at its bottom */}
            <Panel
              className="md:min-h-0"
              bodyClassName="md:overflow-y-auto"
              footer={<div className="hidden md:block">{cta}</div>}
              label={finished ? 'Finished' : project ? 'Your project' : 'Overview'}
              meta={project ? `${done} / ${totalSteps}` : undefined}
              progress={project && totalSteps ? (done / totalSteps) * 100 : undefined}
            >
              {totalSteps > 0 && (
                <PanelRow
                  leading={<StepDot state={project ? 'active' : 'upcoming'}><IconListCheck className="size-3.5" /></StepDot>}
                  title={project ? (finished ? 'Every step done' : `Next: ${guide!.steps[done]?.title ?? ''}`) : `${totalSteps} steps`}
                  detail={project ? sizeLabel(project.size) : 'Stop after any step, your progress is saved.'}
                />
              )}
              {creator && (
                <PanelRow
                  leading={<CreatorAvatar creator={creator} />}
                  title={
                    <Link href={`/creator/${creator.id}`} className="hover:underline hover:underline-offset-4">
                      {creator.handle}
                    </Link>
                  }
                  detail="Pattern maker"
                  trailing={
                    <Button size="sm" variant="outline" aria-pressed={following} onClick={() => setFollowing((f) => !f)}>
                      {following ? <IconCheck data-icon="inline-start" /> : <IconPlus data-icon="inline-start" />}
                      {following ? 'Following' : 'Follow'}
                    </Button>
                  }
                />
              )}
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
              {guide && guide.pieces.length > 0 && (
                <PanelRow
                  leading={<StepDot state="upcoming"><IconPrinter className="size-3.5" /></StepDot>}
                  title={`Pattern · ${guide.pieces.length} pieces`}
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
            </Panel>

          </div>

          {/* Phones: action stays reachable, just above the tab bar */}
          <ActionBar>{cta}</ActionBar>
        </div>
      </div>

      <SizeSheet
        garment={garment}
        open={sizeSheetOpen}
        onClose={() => setSizeSheetOpen(false)}
        initialSize={project?.size ?? profileSize}
        onConfirm={startProject}
      />
    </main>
  )
}
