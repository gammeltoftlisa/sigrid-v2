'use client'

import { useState, use, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { IconPrinter, IconChevronDown, IconNeedleThread } from '@tabler/icons-react'
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
import GuideSidePanel from '@/components/sewing/GuideSidePanel'
import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { ProductFrame } from '@/components/patterns/product-grid'
import { GarmentImage } from '@/components/garment/GarmentImage'
import CompletionDialog from '@/components/sewing/CompletionDialog'
import StepInstruction from '@/components/sewing/StepInstruction'
import { groupIntoJourneys } from '@/lib/journeys'
import { assemblyAt } from '@/lib/assembly'
import { progressStateOf } from '@/components/legacy/progress'
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
  // Bumped when the project restarts so the step list rebuilds from scratch
  const [runId, setRunId] = useState(0)
  // Re-read when progress made on another device arrives
  const sewingVersion = useSewingVersion()

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
  }, [id, guide, guideState, router, sewingVersion])

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
      if (sizeSheetOpen || doneOpen || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      if (e.key === 'ArrowRight') { setDirection(1); setViewStep((v) => Math.min(v + 1, total - 1)) }
      if (e.key === 'ArrowLeft') { setDirection(-1); setViewStep((v) => Math.max(v - 1, 0)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [guide, sizeSheetOpen, doneOpen])

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
    // Remember when each step was done, for streaks and the Projects dashboard
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

  // Navigate canvas view backwards — does NOT change completion status
  const goBack = () => {
    if (viewStep === 0) return
    setDirection(-1)
    setViewStep((s) => s - 1)
  }

  // Preview any step in the canvas — does NOT change completion status
  const preview = (index: number) => {
    setDirection(index < viewStep ? -1 : 1)
    setViewStep(index)
  }

  const step  = steps[viewStep]
  const viewJourney = journeys.find((j) => j.stepIndices.includes(viewStep))
  const piece = step.pieceId ? (guide.pieces.find((p) => p.id === step.pieceId) ?? null) : null
  // Steps that join pieces show them together, with what earlier steps already joined
  const assembly = assemblyAt(guide.steps, viewStep)

  return (
    <main className="guide-page">
      <GuideTopBar garment={garment}>
        {size && (
          <>
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

      <CompletionDialog garment={garment} open={doneOpen} onClose={() => setDoneOpen(false)} />

      <div className="guide-body px-4 pb-3 md:pr-8 md:pb-6 md:pl-4">
        {size && <GuideSidePanel
          keepSections={guide.keepSections}
          sectionIcons={guide.sectionIcons}
          key={runId}
          steps={steps}
          completedUntil={completedUntil}
          viewStep={viewStep}
          isLast={isLast}
          allDone={allDone}
          onNext={advance}
          onPrev={goBack}
          onPreview={preview}
        />}

        {/* The scene and its instructions (on phones: a fixed-height strip above the steps) */}
        <div className="order-1 flex h-[32vh] shrink-0 flex-col gap-(--grid-gutter) md:order-none md:col-span-8 md:h-auto md:min-h-0 xl:col-span-9">
          <ProductFrame className="flex min-h-0 flex-1 flex-col p-2 md:p-3">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-(--image-radius)">
              {allDone ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-6"
                >
                  <GarmentImage name={garment.name} photoSrc={garment.photo} sizes="144px" className="size-28 rounded-(--radius) md:size-36" />
                  <div className="flex flex-col gap-2">
                    <p className="kicker">All {steps.length} steps done</p>
                    <p className="font-heading text-4xl">{garment.name} is <em className="display-italic">finished.</em></p>
                  </div>
                  <Button variant="outline" onClick={() => setDoneOpen(true)}>View summary</Button>
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
                  className="w-full h-full"
                >
                  <PatternCanvas
                    piece={piece}
                    assembly={assembly}
                    pieces={guide.pieces}
                    action={step.action}
                    annotation={step.annotation}
                    fabricSide={step.fabricSide}
                    measurements={measurements}
                    title={step.title}
                  />
                </motion.div>
              </AnimatePresence>
              )}

              {/* Done flash — centered over the canvas only */}
              <AnimatePresence>
                {doneAnim && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <motion.div
                      className="done-flash size-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 1.3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ProductFrame>

          {/* Instructions for the step on the canvas (desktop; phones read them in the list) */}
          {!allDone && (
              <div className="hidden shrink-0 md:block">
                <StepInstruction
                  step={step}
                  index={viewStep}
                  journeyTitle={viewJourney?.title}
                  numberInJourney={(viewJourney?.stepIndices.indexOf(viewStep) ?? 0) + 1}
                  journeyLength={viewJourney?.stepIndices.length ?? 1}
                  state={progressStateOf(viewStep, completedUntil)}
                />
              </div>
          )}
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
