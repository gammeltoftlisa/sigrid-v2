'use client'

import { useState, use, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { IconPrinter, IconChevronDown, IconNeedleThread } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { getGarmentById, getGarmentGuide, standardSizes } from '@/lib/data'
import type { StandardSize, UserMeasurements } from '@/lib/types'
import { loadProject, saveProject } from '@/lib/projects'
import { logStepDone } from '@/lib/activity'
import { sizeLabel } from '@/lib/sizes'
import SizeSheet from '@/components/garment/SizeSheet'
import PatternCanvas from '@/components/sewing/PatternCanvas'
import GuideSidePanel from '@/components/sewing/GuideSidePanel'
import FlowHeader from '@/components/legacy/FlowHeader'
import { GarmentArt } from '@/components/garment/GarmentArt'
import CompletionDialog from '@/components/sewing/CompletionDialog'
import StepInstruction from '@/components/sewing/StepInstruction'
import { groupIntoJourneys } from '@/lib/journeys'
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
  const guide = getGarmentGuide(id)
  const router = useRouter()
  const journeys = useMemo(() => (guide ? groupIntoJourneys(guide.steps) : []), [guide])

  // completedUntil: index of the step currently being worked on (0..n-1 are done)
  const [completedUntil, setCompletedUntil] = useState(0)
  // viewStep: which step is shown in the canvas (can preview any step independently)
  const [viewStep, setViewStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [measurements, setMeasurements] = useState<UserMeasurements>(DEFAULT_MEASUREMENTS)
  const [doneAnim, setDoneAnim] = useState(false)
  const [exiting, setExiting] = useState(false)
  // The sheet always slides up when the guide opens (same on server and client, so hydration matches)
  const animateIn = true

  // The project (size + progress) is set up on the garment page; without one, go back there
  const [size, setSize] = useState<StandardSize | null>(null)
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  // Bumped when the project restarts so the step list rebuilds from scratch
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    const project = loadProject(id)
    if (!project) { router.replace(`/garment/${id}`); return }
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
  }, [id, guide, router])

  // Remember progress so leaving and coming back resumes where you were
  useEffect(() => {
    if (size) saveProject(id, { size, completedUntil })
  }, [id, size, completedUntil])

  const changeSize = (next: StandardSize) => {
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

  if (!guide || guide.steps.length === 0) {
    return (
      <motion.div
        className="guide-sheet fixed inset-x-0 bottom-0 top-3 flex flex-col rounded-t-pane-lg overflow-hidden"
        initial={{ y: animateIn ? '100%' : 0 }}
        animate={{ y: exiting ? '100%' : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onAnimationComplete={() => { if (exiting) router.push(`/garment/${id}`) }}
      >
        <FlowHeader garmentName={garment.name} onClose={() => setExiting(true)} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <IconNeedleThread className="size-10 text-muted-foreground" stroke={1.5} aria-hidden />
          <h2 className="text-3xl">This guide is still <em className="display-italic">being written</em></h2>
          <p className="max-w-prose text-base text-muted-foreground">We’re writing the steps for this garment carefully. They’ll appear here when they’re ready.</p>
          <Button variant="outline" className="mt-2" onClick={() => setExiting(true)}>
            Go back
          </Button>
        </div>
      </motion.div>
    )
  }

  const steps = guide.steps
  const isLast = completedUntil === steps.length - 1
  const allDone = completedUntil >= steps.length

  // Mark current step done and advance
  const advance = () => {
    if (allDone) { setDoneOpen(true); return }
    setDoneAnim(true)
    // Remember when each step was done, for streaks and the Projects dashboard
    logStepDone({ garmentId: id, step: completedUntil, action: steps[completedUntil].action })
    setTimeout(() => {
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

  return (
    <motion.div
      className="guide-sheet fixed inset-x-0 bottom-0 top-3 flex flex-col rounded-t-pane-lg overflow-hidden"
      initial={{ y: animateIn ? '100%' : 0 }}
      animate={{ y: exiting ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      onAnimationComplete={() => { if (exiting) router.push(`/garment/${id}`) }}
    >
      <FlowHeader garmentName={garment.name} garmentId={id} onClose={() => setExiting(true)}>
        {size && (
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="outline" size="sm" className="tabular-nums" onClick={() => setSizeSheetOpen(true)} aria-label={`Size ${sizeLabel(size)}. Change size`}>
              {sizeLabel(size)}
              <IconChevronDown data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="icon" onClick={printPattern} aria-label="Print pattern" title="Print pattern">
              <IconPrinter />
            </Button>
          </div>
        )}
      </FlowHeader>

      <SizeSheet
        garment={garment}
        open={sizeSheetOpen}
        onClose={() => setSizeSheetOpen(false)}
        initialSize={size}
        onConfirm={changeSize}
        progress={size ? { size, done: Math.min(completedUntil, steps.length), total: steps.length } : undefined}
      />

      <CompletionDialog garment={garment} open={doneOpen} onClose={() => setDoneOpen(false)} />

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 overflow-hidden p-3 pt-0">
        {size && <GuideSidePanel
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

        {/* Right 2/3: canvas (on phones: a fixed-height strip above the steps) */}
        <div className="order-1 md:order-none h-[32vh] shrink-0 md:h-auto md:flex-1 flex flex-row overflow-hidden">

          {/* Canvas column */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div data-slot="inset" className="guide-canvas flex-1 relative min-h-0 rounded-(--radius) overflow-hidden">
              {allDone ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-6"
                >
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-(--radius) bg-muted flex items-center justify-center p-6 md:p-8">
                    <GarmentArt name={garment.name} className="w-full h-full" />
                  </div>
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

            {/* Instructions for the step on the canvas (desktop; phones read them in the list) */}
            {!allDone && (
              <div className="hidden md:block shrink-0 pt-3">
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
      </div>
    </motion.div>
  )
}
