'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { IconBulb, IconRuler2, IconCircleCheck } from '@tabler/icons-react'
import type { SewingStep2D } from '@/lib/types'
import type { ProgressState } from '@/components/ui/progress'
import { ACTION_COLORS, ACTION_LABELS } from './actions'
import { TOOLS } from './tools'

interface Props {
  step: SewingStep2D
  /** Position of the step within the whole guide (0-based), used to key the animation */
  index: number
  journeyTitle?: string
  /** 1-based position within its journey, and the journey's length */
  numberInJourney: number
  journeyLength: number
  state: ProgressState
}

/**
 * Large, readable instructions for the step shown on the canvas (desktop).
 * Mirrors the step list, but written out in full so you can read it at a
 * distance while your hands are busy.
 */
export default function StepInstruction({ step, index, journeyTitle, numberInJourney, journeyLength, state }: Props) {
  const tool = step.tool ? TOOLS[step.tool] : null

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section
        key={index}
        aria-live="polite"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={`rounded-3xl border px-6 py-5 ${
          state === 'active' ? 'bg-surface border-primary/30 shadow-soft' : 'bg-surface-2/40 border-rim-soft'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-caption text-ink-3">
            {journeyTitle && <span className="font-semibold text-ink-2">{journeyTitle}</span>}
            {journeyTitle && ' · '}
            Step {numberInJourney} of {journeyLength}
          </p>
          {state === 'done' && (
            <span className="inline-flex items-center gap-1 text-caption font-semibold text-primary">
              <IconCircleCheck size={15} />
              Done
            </span>
          )}
          {state === 'upcoming' && (
            <span className="text-caption font-semibold text-ink-3">Coming up</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 mb-2">
          <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[step.action]}`}>
            {ACTION_LABELS[step.action]}
          </span>
          <h2 className={`text-heading font-bold leading-tight ${state === 'done' ? 'text-ink-2' : 'text-ink'}`}>
            {step.title}
          </h2>
        </div>

        <p className="text-body text-ink-2 leading-relaxed max-w-prose">{step.instruction}</p>

        {(step.measurement || tool) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {step.measurement && (
              <span className="inline-flex items-center gap-1.5 text-label font-semibold bg-primary-soft text-primary-deep px-3 py-1 rounded-full">
                <IconRuler2 size={16} />
                {step.measurement}
              </span>
            )}
            {tool && (
              <span className="inline-flex items-center gap-1.5 text-label font-medium bg-surface-2 text-ink-2 px-3 py-1 rounded-full">
                <tool.Icon size={16} />
                {tool.label}
              </span>
            )}
          </div>
        )}

        {step.tip && (
          <div className="flex items-start gap-2 mt-4 rounded-2xl bg-warn-soft px-4 py-3">
            <IconBulb size={18} className="text-warn shrink-0 mt-0.5" />
            <p className="text-label text-ink leading-relaxed">{step.tip}</p>
          </div>
        )}
      </motion.section>
    </AnimatePresence>
  )
}
