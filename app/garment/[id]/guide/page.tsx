'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getGarmentById, getGarmentGuide } from '@/lib/data'
import type { UserMeasurements } from '@/lib/types'
import PatternCanvas from '@/components/sewing/PatternCanvas'
import GuideSidePanel from '@/components/sewing/GuideSidePanel'
import StepTracker from '@/components/ui/StepTracker'

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

  // completedUntil: index of the step currently being worked on (0..n-1 are done)
  const [completedUntil, setCompletedUntil] = useState(0)
  // viewStep: which step is shown in the canvas (can preview any step independently)
  const [viewStep, setViewStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [measurements, setMeasurements] = useState<UserMeasurements>(DEFAULT_MEASUREMENTS)
  const [doneAnim, setDoneAnim] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('sigrid_measurements')
      if (raw) setMeasurements({ ...DEFAULT_MEASUREMENTS, ...JSON.parse(raw) })
    } catch {}
  }, [])

  if (!guide || guide.steps.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <div className="text-5xl">🧶</div>
        <h2 className="text-heading font-bold text-ink">Guide coming soon</h2>
        <p className="text-body text-ink-2">The step-by-step guide for this garment is still being crafted.</p>
        <button onClick={() => router.back()} className="mt-4 text-label text-primary font-semibold">
          ← Go back
        </button>
      </div>
    )
  }

  const steps = guide.steps
  const isLast = completedUntil === steps.length - 1

  // Mark current step done and advance
  const advance = () => {
    setDoneAnim(true)
    setTimeout(() => {
      setDoneAnim(false)
      if (isLast) {
        router.push(`/garment/${id}/complete`)
      } else {
        const next = completedUntil + 1
        setDirection(1)
        setCompletedUntil(next)
        setViewStep(next)
      }
    }, 500)
  }

  // Navigate canvas view backwards — does NOT change completion status
  const goBack = () => {
    if (viewStep === 0) {
      router.back()
    } else {
      setDirection(-1)
      setViewStep((s) => s - 1)
    }
  }

  // Preview any step in the canvas — does NOT change completion status
  const preview = (index: number) => {
    setDirection(index < viewStep ? -1 : 1)
    setViewStep(index)
  }

  const step  = steps[viewStep]
  const piece = step.pieceId ? (guide.pieces.find((p) => p.id === step.pieceId) ?? null) : null

  return (
    <div className="fixed inset-0 flex flex-col bg-bg overflow-hidden">
      <StepTracker
        current="guide"
        garmentId={id}
        garmentName={garment.name}
        stepProgress={completedUntil / steps.length}
      />

      <div className="flex-1 flex flex-row overflow-hidden">
        <GuideSidePanel
          steps={steps}
          completedUntil={completedUntil}
          viewStep={viewStep}
          isLast={isLast}
          onNext={advance}
          onPrev={goBack}
          onExit={() => router.push('/home')}
          onPreview={preview}
        />

        {/* Right 2/3: canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative px-5 py-2 min-h-0">
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
                />
              </motion.div>
            </AnimatePresence>

            {/* Done flash */}
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
        </div>
      </div>
    </div>
  )
}
