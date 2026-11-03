'use client'

import { useState, use, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { IconPrinter, IconChevronDown, IconListNumbers, IconNeedleThread } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { getGarmentById, standardSizes } from '@/lib/data'
import { useGarmentGuide } from '@/hooks/use-garment-guide'
import { Spinner } from '@/components/ui/spinner'
import type { Garment, StandardSize, UserMeasurements } from '@/lib/types'
import { loadProject, saveProject } from '@/lib/projects'
import { useSewingVersion } from '@/hooks/use-mounted'
import { logStepDone } from '@/lib/activity'
import { sizeLabel } from '@/lib/sizes'
import SizeSheet from '@/components/garment/SizeSheet'
import PatternCanvas from '@/components/sewing/PatternCanvas'
import StepCard from '@/components/sewing/StepCard'
import StepsList from '@/components/sewing/StepsList'
import { PanelSheet } from '@/components/patterns/panel-sheet'
import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { ProductFrame } from '@/components/patterns/product-grid'
import { GarmentImage } from '@/components/garment/GarmentImage'
import CompletionDialog from '@/components/sewing/CompletionDialog'
import BeforeYouStart from '@/components/sewing/BeforeYouStart'
import { TOOLS } from '@/components/sewing/tools'
import { getFabricNeed, metersFor } from '@/lib/fabric/needs'
import { formatMeters } from '@/lib/fabric/pricing'
import { readRaw, writeRaw } from '@/lib/local-store'
import { groupIntoJourneys } from '@/lib/journeys'
import { ease } from '@/components/patterns/reveal'

const DEFAULT_MEASUREMENTS: UserMeasurements = {
  bust: 88, waist: 70, hips: 96, height: 168, inseam: 78,
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

export default function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const garment = getGarmentById(id)
  const { guide, state: guideState, retry: retryGuide } = useGarmentGuide(id)
  const router = useRouter()
  const journeys = useMemo(() => (guide ? groupIntoJourneys(guide.steps, { keepSections: guide.keepSections }) : []), [guide])

  // completedUntil: index of the step currently being worked on (0..n-1 are done)
  const [completedUntil, setCompletedUntil] = useState(0)
  // viewStep: which step is shown in the canvas (can preview any step independently)
  const [viewStep, setViewStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [measurements, setMeasurements] = useState<UserMeasurements>(DEFAULT_MEASUREMENTS)
  const [doneAnim, setDoneAnim] = useState(false)

  // The project (size + progress) is set up on the garment page; without one, go back there
  const [size, setSize] = useState<StandardSize | null>(null)
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  // The whole guide, on demand: the step card shows one step at a time
  const [stepsOpen, setStepsOpen] = useState(false)
  // Bumped when the project restarts so the step list rebuilds from scratch
  const [runId, setRunId] = useState(0)
  // Re-read when progress made on another device arrives
  const sewingVersion = useSewingVersion()
  // The first time a guide opens, before step 1
  const readyKey = `sigrid_ready_${id}`
  const [beforeOpen, setBeforeOpen] = useState(false)

  useEffect(() => {
    const project = loadProject(id)
    if (!project) { router.replace(`/garment/${id}`); return }
    // Wait for the guide: resuming against an empty one would reset the saved progress to 0
    if (guideState !== 'ready') return
    const total = guide?.steps.length ?? 0
    const last = Math.max(0, total - 1)
    // completedUntil === total means every step is done
    const resumeAt = Math.min(project.completedUntil, total)
    // Reading saved progress from localStorage has to wait until after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSize(project.size)
    setMeasurements(standardSizes[project.size])
    setCompletedUntil(resumeAt)
    setViewStep(Math.min(resumeAt, last))
    if (resumeAt === 0 && !readRaw(readyKey)) setBeforeOpen(true)
  }, [id, guide, guideState, router, sewingVersion, readyKey])

  // Remember progress so leaving and coming back resumes where you were
  useEffect(() => {
    if (size) saveProject(id, { size, completedUntil })
  }, [id, size, completedUntil])

  // The short pause while a step is being marked done
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (doneTimer.current) clearTimeout(doneTimer.current)
  }, [])

  const changeSize = (next: StandardSize) => {
    // A step finishing now belongs to the old size; it mustn't land on the new start
    if (doneTimer.current) clearTimeout(doneTimer.current)
    doneTimer.current = null
    setDoneAnim(false)
    saveProject(id, { size: next, completedUntil: 0 })
    setSize(next)
    setMeasurements(standardSizes[next])
    setCompletedUntil(0)
    setViewStep(0)
    setDirection(-1)
    setRunId((n) => n + 1)
    setSizeSheetOpen(false)
  }

  // Desktop: ← → move through steps (viewing only, never marks anything done)
  useEffect(() => {
    const total = guide?.steps.length ?? 0
    const onKey = (e: KeyboardEvent) => {
      if (sizeSheetOpen || doneOpen || stepsOpen || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      if (e.key === 'ArrowRight') { setDirection(1); setViewStep((v) => Math.min(v + 1, total - 1)) }
      if (e.key === 'ArrowLeft') { setDirection(-1); setViewStep((v) => Math.max(v - 1, 0)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [guide, sizeSheetOpen, doneOpen, stepsOpen])

  const printPattern = () => window.open(`/garment/${id}/pattern?print=true${size ? `&size=${size}` : ''}`, '_blank')

  // Not bought: the garment page offers it
  if (guideState === 'locked') {
    router.replace(`/garment/${id}`)
    return null
  }

  if (guideState === 'loading' || guideState === 'error') {
    return (
      <main className="guide-page">
        <GuideTopBar garment={garment} />
        <div className="px-4 pb-6 md:pr-8 md:pl-4">
          <Empty className="border">
            <EmptyHeader>
              {guideState === 'loading' ? <Spinner /> : <EmptyMedia variant="icon"><IconNeedleThread /></EmptyMedia>}
              <EmptyTitle>{guideState === 'loading' ? 'Opening your guide' : 'The guide didn’t open'}</EmptyTitle>
              {guideState === 'error' && <EmptyDescription>This is usually a connection problem. Your progress is safe.</EmptyDescription>}
            </EmptyHeader>
            {guideState === 'error' && (
              <EmptyContent>
                <Button onClick={retryGuide}>Try again</Button>
              </EmptyContent>
            )}
          </Empty>
        </div>
      </main>
    )
  }

  if (!guide || guide.steps.length === 0) {
    return (
      <main className="guide-page">
        <GuideTopBar garment={garment} />
        <div className="px-4 pb-6 md:pr-8 md:pl-4">
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><IconNeedleThread /></EmptyMedia>
              <EmptyTitle>This guide is still being written</EmptyTitle>
              <EmptyDescription>We’re writing the steps for this garment carefully. They’ll appear here when they’re ready.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" nativeButton={false} render={<Link href={`/garment/${id}`} />}>Go back</Button>
            </EmptyContent>
          </Empty>
        </div>
      </main>
    )
  }

  const steps = guide.steps
  const isLast = completedUntil === steps.length - 1
  const allDone = completedUntil >= steps.length

  // Mark current step done and advance
  const advance = () => {
    if (allDone) { setDoneOpen(true); return }
    // A second press during the pause would be the same step again
    if (doneTimer.current) return
    setDoneAnim(true)
    // Remember when each step was done, for streaks and the dashboard on Home
    logStepDone({ garmentId: id, step: completedUntil, action: steps[completedUntil].action })
    doneTimer.current = setTimeout(() => {
      doneTimer.current = null
      setDoneAnim(false)
      if (isLast) {
        // Last step: everything is done — celebrate over the guide
        setCompletedUntil(steps.length)
        setDoneOpen(true)
      } else {
        const next = completedUntil + 1
        setDirection(1)
        setCompletedUntil(next)
        // Only jump the view if the user is currently looking at the active step.
        // If they're previewing a different step, leave the view where it is so
        // the progress line advances without the canvas snapping to an unexpected step.
        if (viewStep === completedUntil) {
          setViewStep(next)
        }
      }
    }, 500)
  }

  // Show any step: never changes what's done
  const preview = (index: number) => {
    const to = Math.max(0, Math.min(index, steps.length - 1))
    if (to === viewStep) return
    setDirection(to < viewStep ? -1 : 1)
    setViewStep(to)
  }

  return (
    <main className="guide-page">
      <GuideTopBar garment={garment}>
        {size && (
          <>
            <Button variant="outline" size="sm" onClick={() => setStepsOpen(true)} aria-label="All steps">
              <IconListNumbers data-icon="inline-start" />
              <span className="max-sm:sr-only">All steps</span>
            </Button>
            <Button variant="outline" size="sm" className="tabular-nums" onClick={() => setSizeSheetOpen(true)} aria-label={`Size ${sizeLabel(size)}. Change size`}>
              {sizeLabel(size)}
              <IconChevronDown data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="icon" onClick={printPattern} aria-label="Print pattern" title="Print pattern">
              <IconPrinter />
            </Button>
          </>
        )}
      </GuideTopBar>

      <SizeSheet
        garment={garment}
        open={sizeSheetOpen}
        onClose={() => setSizeSheetOpen(false)}
        initialSize={size}
        onConfirm={changeSize}
        progress={size ? { size, done: Math.min(completedUntil, steps.length), total: steps.length } : undefined}
      />

      {size && (
        <BeforeYouStart
          open={beforeOpen}
          printHref={`/garment/${id}/pattern?print=true&size=${size}`}
          fabricHref={`/fabric?garment=${id}`}
          fabricDetail={`${formatMeters(metersFor(getFabricNeed(id), size))} for ${sizeLabel(size)}`}
          tools={[...new Set(steps.flatMap((s) => (s.tool ? [TOOLS[s.tool].label.toLowerCase()] : [])))].join(', ').replace(/^./, (c) => c.toUpperCase())}
          onReady={() => {
            writeRaw(readyKey, '1')
            setBeforeOpen(false)
          }}
        />
      )}

      <CompletionDialog garment={garment} open={doneOpen} onClose={() => setDoneOpen(false)} />

      <PanelSheet
        open={stepsOpen}
        onOpenChange={setStepsOpen}
        title="All steps"
        description={`${Math.min(completedUntil, steps.length)} of ${steps.length} done. Pick one to see it; nothing is marked done.`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
          <StepsList
            key={runId}
            steps={steps}
            completedUntil={completedUntil}
            viewStep={viewStep}
            keepSections={guide.keepSections}
            sectionIcons={guide.sectionIcons}
            onPick={(i) => {
              preview(i)
              setStepsOpen(false)
            }}
          />
        </div>
      </PanelSheet>

      <h1 className="sr-only">{garment.name}: sewing guide</h1>
      {/* One step at a time: the card to read and act on, and the picture of it. Phones: the picture on top. */}
      <div className="guide-body px-4 pb-3 md:pr-8 md:pb-6 md:pl-4">
        {size && (
          <div className="order-2 flex min-h-0 flex-1 flex-col md:order-none md:col-span-5 lg:col-span-4 xl:col-span-3">
            <StepCard
              key={runId}
              steps={steps}
              journeys={journeys}
              viewStep={viewStep}
              completedUntil={completedUntil}
              garmentName={garment.name}
              onNext={advance}
              onPreview={preview}
            />
          </div>
        )}

        <div className="order-1 guide-canvas-pane flex shrink-0 flex-col md:order-none md:col-span-7 md:h-auto md:min-h-0 lg:col-span-8 xl:col-span-9">
          <ProductFrame className="flex min-h-0 flex-1 flex-col p-2 md:p-3">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-(--image-radius)">
              {allDone ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full w-full items-center justify-center p-6"
                >
                  <GarmentImage name={garment.name} photoSrc={garment.photo} sizes="(min-width: 768px) 40vw, 60vw" className="aspect-product h-full max-h-96 rounded-(--image-radius)" />
                </motion.div>
              ) : (
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={viewStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.32, ease }}
                    className="h-full w-full"
                  >
                    <PatternCanvas steps={guide.steps} index={viewStep} pieces={guide.pieces} measurements={measurements} />
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Done flash, over the picture only */}
              <AnimatePresence>
                {doneAnim && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <motion.div
                      className="done-flash flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 1.3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ProductFrame>
        </div>
      </div>
    </main>
  )
}

/** The same top line as every screen: where you are, and this project's settings on the right. */
function GuideTopBar({ garment, children }: { garment: Garment; children?: React.ReactNode }) {
  return (
    <div className="shrink-0 px-4 md:pr-8 md:pl-4">
      <div className="top-bar flex h-14 items-center gap-2">
        {/* Phones: just the garment, so nothing gets cut off; the full trail from sm */}
        <Link href={`/garment/${garment.id}`} className="min-w-0 truncate text-sm font-medium underline-offset-4 hover:underline sm:hidden">
          {garment.name}
        </Link>
        <PageBreadcrumbs
          className="hidden min-w-0 whitespace-nowrap sm:flex"
          items={[
            { label: 'Home', href: '/home' },
            { label: garment.name, href: `/garment/${garment.id}` },
            { label: 'Sewing guide' },
          ]}
        />
        {children && <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
