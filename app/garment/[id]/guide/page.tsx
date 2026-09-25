'use client'

import { useState, use, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { IconPrinter, IconChevronDown, IconNeedleThread } from '@tabler/icons-react'
import { textLink } from '@/components/ui/interaction'
import { getGarmentById, getGarmentGuide, standardSizes } from '@/lib/data'
import type { StandardSize, UserMeasurements } from '@/lib/types'
import { loadProject, saveProject } from '@/lib/projects'
import { sizeLabel } from '@/lib/sizes'
import SizeSheet from '@/components/garment/SizeSheet'
import PatternCanvas from '@/components/sewing/PatternCanvas'
import GuideSidePanel from '@/components/sewing/GuideSidePanel'
import FlowHeader from '@/components/ui/FlowHeader'
import GarmentIllustration from '@/components/ui/GarmentIllustration'
import CompletionDialog from '@/components/sewing/CompletionDialog'
import StepInstruction from '@/components/sewing/StepInstruction'
import { groupIntoJourneys } from '@/lib/journeys'
import { progressStateOf } from '@/components/ui/progress'

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
  const [animateIn] = useState(() => {
    if (typeof window === 'undefined') return false
    const flag = sessionStorage.getItem('sigrid_flow_enter')
    if (flag) { sessionStorage.removeItem('sigrid_flow_enter'); return true }
    return false
  })

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

  const printPattern = () => window.open(`/garment/${id}/pattern?print=true`, '_blank')

  if (!guide || guide.steps.length === 0) {
    return (
      <motion.div
        className="fixed inset-x-0 bottom-0 top-3 flex flex-col bg-bg rounded-t-3xl overflow-hidden shadow-modal"
        initial={{ y: animateIn ? '100%' : 0 }}
        animate={{ y: exiting ? '100%' : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onAnimationComplete={() => { if (exiting) router.push(`/garment/${id}`) }}
      >
        <FlowHeader garmentName={garment.name} onClose={() => setExiting(true)} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <IconNeedleThread size={44} stroke={1.5} className="text-ink-3" />
          <h2 className="text-heading font-bold text-ink">Guide coming soon</h2>
          <p className="text-body text-ink-2">The step-by-step guide for this garment is still being crafted.</p>
          <button onClick={() => setExiting(true)} className={`mt-2 text-label ${textLink}`}>
            Go back
          </button>
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
      className="fixed inset-x-0 bottom-0 top-3 flex flex-col bg-bg rounded-t-3xl overflow-hidden shadow-modal"
      initial={{ y: animateIn ? '100%' : 0 }}
      animate={{ y: exiting ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      onAnimationComplete={() => { if (exiting) router.push(`/garment/${id}`) }}
    >
      <FlowHeader garmentName={garment.name} onClose={() => setExiting(true)}>
        {size && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setSizeSheetOpen(true)}
              aria-label={`Size ${sizeLabel(size)}. Change size`}
              className="inline-flex items-center gap-1 h-7 pl-2.5 pr-2 rounded-full border border-rim bg-surface text-caption font-semibold text-ink-2 hover:bg-surface-2 active:scale-90 transition duration-150"
            >
              {sizeLabel(size)}
              <IconChevronDown size={12} />
            </button>
            <button
              onClick={printPattern}
              aria-label="Print pattern"
              title="Print pattern"
              className="w-7 h-7 rounded-full border border-rim bg-surface text-ink-2 flex items-center justify-center hover:bg-surface-2 active:scale-90 transition duration-150"
            >
              <IconPrinter size={14} />
            </button>
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

      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {size && <GuideSidePanel
          key={runId}
          steps={steps}
          completedUntil={completedUntil}
          viewStep={viewStep}
          isLast={isLast}
          allDone={allDone}
          onNext={advance}
          onPrev={goBack}
          onExit={() => router.push('/home')}
          onPreview={preview}
        />}

        {/* Right 2/3: canvas (on phones: a fixed-height strip above the steps) */}
        <div className="order-1 md:order-none h-[34vh] shrink-0 md:h-auto md:flex-1 flex flex-row overflow-hidden">

          {/* Canvas column */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative px-5 py-2 min-h-0">
              {allDone ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex flex-col items-center justify-center gap-4 bg-surface-2 rounded-3xl text-center px-6"
                >
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-primary-soft flex items-center justify-center p-6 md:p-8">
                    <GarmentIllustration name={garment.name} className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-heading font-bold text-ink">All {steps.length} steps done</p>
                    <p className="text-caption text-ink-3 mt-1">{garment.name} is finished.</p>
                  </div>
                  <button onClick={() => setDoneOpen(true)} className={`text-label ${textLink}`}>View summary</button>
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
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
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
                      className="w-20 h-20 rounded-full bg-success flex items-center justify-center shadow-modal"
                      initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 1.3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <path d="M20 7L9 18L4 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Instructions for the step on the canvas (desktop; phones read them in the list) */}
            {!allDone && (
              <div className="hidden md:block shrink-0 px-5 pb-5 pt-1">
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
