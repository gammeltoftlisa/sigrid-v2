'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

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
    key: 'materials',
    label: 'Materials',
    subSteps: ['Choose fabric', 'Check quantity', 'Find a shop'],
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
  materials:    (id) => `/garment/${id}/materials`,
  guide:        (id) => `/garment/${id}/guide`,
  complete:     (id) => `/garment/${id}/complete`,
}

const NODE = 32

export default function StepTracker({ current, garmentId, garmentName, stepProgress = 0, onClose }: Props) {
  const currentIdx = GARMENT_STEPS.findIndex((s) => s.key === current)
  const router = useRouter()
  const total = GARMENT_STEPS.length
  // Add fractional within-step progress so the line extends past the active circle
  const progressFraction = (currentIdx + stepProgress) / (total - 1)

  return (
    <div className="w-full shrink-0 bg-bg border-b border-rim">

      {/* ── Garment title + close — above the progress line ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <p className="text-label font-bold text-ink">{garmentName}</p>
        <button
          onClick={() => onClose ? onClose() : router.push(`/garment/${garmentId}`)}
          className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-rim transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="var(--sig-ink-2)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Progress line: circles only ── */}
      <div className="relative flex items-center justify-between px-6 mb-2">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-rim"
          style={{ left: 24 + NODE / 2, right: 24 + NODE / 2 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-primary transition-all duration-500"
          style={{ left: 24 + NODE / 2, width: `calc((100% - ${48 + NODE}px) * ${progressFraction})` }}
        />

        {GARMENT_STEPS.map((step, i) => {
          const done   = i < currentIdx
          const active = i === currentIdx
          return (
            <button
              key={step.key}
              onClick={() => !active && router.push(STEP_URLS[step.key](garmentId))}
              className="relative z-10 active:opacity-70 transition-opacity"
            >
              <motion.div
                initial={false}
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  done || active ? 'bg-primary border-primary' : 'bg-surface-2 border-rim'
                }`}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className={`text-xs font-bold leading-none ${active ? 'text-white' : 'text-ink-3'}`}>
                    {i + 1}
                  </span>
                )}
              </motion.div>
            </button>
          )
        })}
      </div>

      {/* ── Labels ── */}
      <div className="flex justify-between px-6 pb-3">
        {GARMENT_STEPS.map((step, i) => {
          const done   = i < currentIdx
          const active = i === currentIdx
          return (
            <div key={step.key} style={{ width: NODE }} className="flex justify-center">
              <span className={`text-[11px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                done || active ? 'text-primary' : 'text-ink-3'
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
