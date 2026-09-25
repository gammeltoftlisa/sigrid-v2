'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useFlowOptional, type FlowStep } from '@/lib/flow-context'

export const GARMENT_STEPS = [
  {
    key: 'measurements',
    label: 'Measure',
    subSteps: ['Bust', 'Waist', 'Hips', 'Height', 'Inseam'],
  },
  {
    key: 'pattern',
    label: 'Pattern',
    subSteps: ['Front panel', 'Back panel', 'Left sleeve', 'Right sleeve'],
  },
  {
    key: 'guide',
    label: 'Sewing',
    subSteps: ['Prepare', 'Cut', 'Shoulders', 'Neckline', 'Sleeves', 'Side seams', 'Hems', 'Finish'],
  },
  {
    key: 'complete',
    label: 'Done',
    subSteps: ['Rate your make', 'Share it'],
  },
] as const

export type StepKey = typeof GARMENT_STEPS[number]['key']

interface Props {
  current: StepKey
  garmentId: string
  garmentName: string
  /** 0–1: how far through the current step the user is. Extends the filled line past the active circle. */
  stepProgress?: number
  /** If provided, called instead of router.push when the X is clicked (use to play exit animation first). */
  onClose?: () => void
}

const STEP_URLS: Record<StepKey, (id: string) => string> = {
  measurements: (id) => `/garment/${id}/measurements`,
  pattern:      (id) => `/garment/${id}/pattern`,
  guide:        (id) => `/garment/${id}/guide`,
  complete:     (id) => `/garment/${id}/complete`,
}

export default function StepTracker({ current, garmentId, garmentName, stepProgress = 0, onClose }: Props) {
  const viewIdx = GARMENT_STEPS.findIndex((s) => s.key === current)
  const router = useRouter()
  const flow = useFlowOptional()
  const total = GARMENT_STEPS.length

  // Progress (checkmarks + line) tracks the furthest step ever reached, not the
  // step currently being viewed — going back to review a finished step must not
  // make it look unfinished again.
  const furthestIdx = flow ? GARMENT_STEPS.findIndex((s) => s.key === flow.furthestStep) : viewIdx
  // Fractional within-step progress only extends the line when we're actually
  // looking at the leading edge — a completed step being reviewed is fully done.
  const progressFraction = (furthestIdx + (viewIdx === furthestIdx ? stepProgress : 0)) / (total - 1)

  return (
    // --node/--pad drive the circle size and side inset in the two rows below —
    // smaller on mobile, back to the original size at md+ — kept as CSS vars so the
    // line math stays in sync with the circle size at each breakpoint without JS.
    <div className="w-full shrink-0 bg-bg border-b border-rim [--node:24px] [--pad:16px] md:[--node:32px] md:[--pad:24px]">

      {/* ── Garment title + close — above the progress line ── */}
      <div className="flex items-center justify-between px-4 md:px-5 pt-3 md:pt-4 pb-2.5 md:pb-3">
        <p className="text-label font-bold text-ink">{garmentName}</p>
        <button
          onClick={() => onClose ? onClose() : router.push(`/garment/${garmentId}`)}
          className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-rim transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="w-3 h-3 md:w-3.5 md:h-3.5">
            <path d="M18 6L6 18M6 6L18 18" stroke="var(--sig-ink-2)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Progress line: circles only ── */}
      <div className="relative flex items-center justify-between px-4 md:px-6 mb-1.5 md:mb-2">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-rim"
          style={{ left: 'calc(var(--pad) + var(--node) / 2)', right: 'calc(var(--pad) + var(--node) / 2)' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-primary transition-all duration-500"
          style={{ left: 'calc(var(--pad) + var(--node) / 2)', width: `calc((100% - var(--pad) * 2 - var(--node)) * ${progressFraction})` }}
        />

        {GARMENT_STEPS.map((step, i) => {
          const done      = i < furthestIdx
          const isFurthest = i === furthestIdx
          const isViewing = i === viewIdx
          const filled    = done || isFurthest
          // Only steps already reached are navigable — clicking ahead must never
          // fast-forward progress. Reaching a step happens solely via its own
          // continue/finish action (completeStep), never by clicking the tracker.
          const reachable = i <= furthestIdx
          return (
            <button
              key={step.key}
              disabled={!reachable}
              onClick={() => reachable && !isViewing && (flow ? flow.goToStep(step.key as FlowStep) : router.push(STEP_URLS[step.key](garmentId)))}
              className={`relative z-10 transition-opacity ${reachable ? 'active:opacity-70' : 'cursor-default'}`}
            >
              <motion.div
                initial={false}
                animate={{ scale: isFurthest ? 1.1 : isViewing ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`w-[var(--node)] h-[var(--node)] rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  filled ? 'bg-primary border-primary' : 'bg-surface-2 border-rim'
                } ${isViewing && !isFurthest ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg' : ''}`}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5 md:w-3 md:h-3">
                    <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className={`text-[10px] md:text-xs font-bold leading-none ${filled ? 'text-white' : 'text-ink-3'}`}>
                    {i + 1}
                  </span>
                )}
              </motion.div>
            </button>
          )
        })}
      </div>

      {/* ── Labels ── */}
      <div className="flex justify-between px-4 md:px-6 pb-2.5 md:pb-3">
        {GARMENT_STEPS.map((step, i) => {
          const done      = i < furthestIdx
          const isFurthest = i === furthestIdx
          const isViewing = i === viewIdx
          return (
            <div key={step.key} className="w-[var(--node)] flex justify-center">
              <span className={`text-[10px] md:text-[11px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                done || isFurthest || isViewing ? 'text-primary' : 'text-ink-3'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

    </div>
  )
}
