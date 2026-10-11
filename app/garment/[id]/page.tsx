'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  IconArrowRight,
  IconCheck,
  IconPlus,
  IconPrinter,
  IconShirt,
} from '@tabler/icons-react'

import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'
import { ProjectPanel } from '@/components/patterns/project-panel'
import { Button } from '@/components/ui/button'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { BackButton } from '@/components/patterns/page-header'
import { GarmentImage } from '@/components/garment/GarmentArt'
import SizeSheet from '@/components/garment/SizeSheet'
import { useMounted } from '@/hooks/use-mounted'
import { TOOLS } from '@/components/sewing/tools'
import { creators, getGarmentById, getGarmentGuide, standardSizes, tshirtFabrics } from '@/lib/data'
import { groupIntoJourneys } from '@/lib/journeys'
import { loadProject, saveProject, type ProjectState } from '@/lib/projects'
import { projectPanelData } from '@/lib/project-summary'
import { loadSavedSize, sizeLabel } from '@/lib/sizes'
import type { GuidePiece, StandardSize, UserMeasurements } from '@/lib/types'

const pieceName = (p: GuidePiece) => p.name ?? p.id.charAt(0).toUpperCase() + p.id.slice(1).replace(/-/g, ' ')

const pieceDims = (p: GuidePiece, m: UserMeasurements) => {
  const d = typeof p.dims === 'function' ? p.dims(m) : p.dims
  return `${Math.max(d.topWidth, d.bottomWidth)} × ${d.height} cm`
}

export default function GarmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const garment = getGarmentById(id)
  const fabric = tshirtFabrics[0]
  const creator = garment.isCreator && garment.creatorId ? creators.find((c) => c.id === garment.creatorId) : null
  const [following, setFollowing] = useState(false)
  const guide = getGarmentGuide(id)
  const journeys = useMemo(() => (guide ? groupIntoJourneys(guide.steps) : []), [guide])
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

  const onCta = () => (inProgress ? enterGuide() : setSizeSheetOpen(true))
  const ctaLabel = inProgress ? 'Continue sewing' : finished ? 'Sew it again' : `Start sewing · €${garment.price}`
  const sizeRange = `${garment.sizes[0]}–${garment.sizes[garment.sizes.length - 1]}`

  const printHref = `/garment/${id}/pattern?print=true${project ? `&size=${project.size}` : ''}`

  const cta = (
    <div className="flex flex-col gap-1.5">
      <Button size="lg" className="w-full" onClick={onCta}>
        {ctaLabel}
        {inProgress && <IconArrowRight data-icon="inline-end" />}
      </Button>
      {inProgress && (
        <p className="text-center text-xs text-muted-foreground tabular-nums">
          {done} of {totalSteps} steps done · {sizeLabel(project!.size)}
        </p>
      )}
    </div>
  )

  return (
    <main className="min-h-svh">
      {/* Top bar, like the sewing guide's: where you are, and quick actions */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/85 sm:px-6">
        <BackButton />
        <PageBreadcrumbs
          items={[
            { label: 'Home', href: '/home' },
            ...(garment.isCreator ? [{ label: 'Explore', href: '/explore' }] : []),
            { label: garment.name },
          ]}
        />
        {project && (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="eyebrow hidden border px-2 py-1 text-muted-foreground sm:inline">{sizeLabel(project.size)}</span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Print pattern in ${sizeLabel(project.size)}`}
              render={<a href={printHref} target="_blank" rel="noopener" />}
            >
              <IconPrinter />
            </Button>
          </div>
        )}
      </div>

      <div className="md:grid md:grid-cols-2">
        {/* Garment image: top of the page on phones, sticky left half from md */}
        <div className="md:sticky md:top-14 md:h-[calc(100svh-3.5rem)]">
          <GarmentImage
            name={garment.name}
            className="mx-4 mt-4 aspect-[4/5] p-10 sm:mx-6 md:m-0 md:aspect-auto md:h-full md:p-16"
            artClassName="max-w-72 md:max-w-sm"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex w-full flex-1 flex-col gap-4 px-4 pt-6 pb-32 sm:px-6 md:px-10 md:pt-10 md:pb-0">
            <header className="flex flex-col gap-3 pb-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">{garment.name}</h1>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">€{garment.price}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {garment.difficulty} · {garment.estimatedTime} · Sizes {sizeRange}
              </p>
              <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{garment.description}</p>
            </header>

            {project ? (
              <ProjectPanel
                {...projectPanelData(garment, project.size, project.completedUntil)}
                showImage={false}
                showAction={false}
                label={finished ? 'Finished' : 'Your project'}
              />
            ) : (
              journeys.length > 0 && (
                <Panel label="How it goes" meta={`${totalSteps} steps`}>
                  {journeys.map((j, i) => (
                    <PanelRow
                      key={j.key}
                      leading={<StepDot state="upcoming">{i + 1}</StepDot>}
                      title={j.title}
                      meta={`${j.stepIndices.length} ${j.stepIndices.length === 1 ? 'step' : 'steps'}`}
                    />
                  ))}
                  <p className="px-1 pt-1 text-xs text-muted-foreground">Stop after any step, your progress is saved.</p>
                </Panel>
              )
            )}

            {creator && (
              <Panel label="Pattern maker">
                <PanelRow
                  leading={<CreatorAvatar creator={creator} />}
                  title={
                    <Link href={`/creator/${creator.id}`} className="hover:underline hover:underline-offset-4">
                      {creator.handle}
                    </Link>
                  }
                  detail={`${creator.followerCount} followers${creator.isCertified ? ' · Certified' : ''}`}
                  trailing={
                    <Button size="sm" variant={following ? 'outline' : 'secondary'} aria-pressed={following} onClick={() => setFollowing((f) => !f)}>
                      {following ? <IconCheck data-icon="inline-start" /> : <IconPlus data-icon="inline-start" />}
                      {following ? 'Following' : 'Follow'}
                    </Button>
                  }
                />
              </Panel>
            )}

            <Panel label="What you’ll need" meta={`${tools.length + 1} items`}>
              <PanelRow
                leading={
                  <StepDot state="upcoming">
                    <IconShirt className="size-3.5" />
                  </StepDot>
                }
                title={fabric.name}
                detail={`${fabric.description}${fabric.isEco ? ' Lower-impact choice.' : ''}`}
                meta={`${fabric.quantityMeters} m`}
              />
              {tools.map((t) => {
                const ToolIcon = TOOLS[t].Icon
                return (
                  <PanelRow
                    key={t}
                    leading={
                      <StepDot state="upcoming">
                        <ToolIcon className="size-3.5" />
                      </StepDot>
                    }
                    title={TOOLS[t].label}
                  />
                )
              })}
              <p className="px-1 pt-1 text-xs text-muted-foreground">
                Fabric amount {project ? `is for ${sizeLabel(project.size)}` : 'varies slightly by size'}.
              </p>
            </Panel>

            {guide && guide.pieces.length > 0 && (
              <Panel
                label="Pattern"
                meta={`${guide.pieces.length} pieces`}
                footer={
                  project ? (
                    <Button variant="outline" className="w-full" render={<a href={printHref} target="_blank" rel="noopener" />}>
                      <IconPrinter data-icon="inline-start" />
                      Print pattern in {sizeLabel(project.size)}
                    </Button>
                  ) : (
                    <p className="px-1 text-sm text-muted-foreground">Your printable pattern is ready as soon as you choose a size.</p>
                  )
                }
              >
                {guide.pieces.map((p) => (
                  <PanelRow
                    key={p.id}
                    leading={<StepDot state="upcoming">{p.label}</StepDot>}
                    title={pieceName(p)}
                    meta={project ? pieceDims(p, standardSizes[project.size]) : undefined}
                  />
                ))}
              </Panel>
            )}

            <div className="sticky bottom-0 -mx-10 mt-auto hidden border-t bg-background px-10 py-4 md:block">{cta}</div>
          </div>

          {/* Phones: action stays reachable at the bottom */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
            {cta}
          </div>
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
