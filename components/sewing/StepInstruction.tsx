'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { IconBulb, IconRuler2, IconCircleCheck } from '@tabler/icons-react'
import type { SewingStep2D } from '@/lib/types'
import type { ProgressState } from '@/components/legacy/progress'
import { ACTION_LABELS } from './actions'
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
        className="glass-panel rounded-(--radius) px-5 py-4"
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs text-muted-foreground">
            {journeyTitle && <span className="font-medium text-foreground">{journeyTitle}</span>}
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
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-card">
            {ACTION_LABELS[step.action]}
          </span>
          <h2 className={`text-lg font-semibold leading-tight ${state === 'done' ? 'text-muted-foreground' : 'text-foreground'}`}>
            {step.title}
          </h2>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">{step.instruction}</p>

        {(step.measurement || tool) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {step.measurement && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-card text-foreground px-3 py-1 rounded-full">
                <IconRuler2 size={16} />
                {step.measurement}
              </span>
            )}
            {tool && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-card text-muted-foreground px-3 py-1 rounded-full">
                <tool.Icon size={16} />
                {tool.label}
              </span>
            )}
          </div>
        )}

        {step.tip && (
          <div className="flex items-start gap-2 mt-3 rounded-(--control-radius) bg-card px-4 py-3">
            <IconBulb size={18} className="text-warning-solid shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">{step.tip}</p>
          </div>
        )}
      </motion.section>
    </AnimatePresence>
  )
}
