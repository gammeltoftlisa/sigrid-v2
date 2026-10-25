'use client'

import { motion, AnimatePresence } from 'motion/react'
import { IconBulb, IconRuler2, IconCircleCheck } from '@tabler/icons-react'
import type { SewingStep2D } from '@/lib/types'
import type { ProgressState } from '@/components/legacy/progress'
import { ACTION_LABELS } from './actions'
import { TOOLS } from './tools'
import { ease } from '@/components/patterns/reveal'

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
        transition={{ duration: 0.3, ease }}
        className="glass-panel rounded-(--radius) px-5 py-4"
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="kicker">
            {journeyTitle && `${journeyTitle} · `}
            Step {numberInJourney} of {journeyLength}
          </p>
          {state === 'done' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <IconCircleCheck size={15} />
              Done
            </span>
          )}
          {state === 'upcoming' && (
            <span className="text-xs font-medium text-muted-foreground">Coming up</span>
          )}
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <span className="eyebrow shrink-0 rounded-full bg-card px-2.5 py-1 text-muted-foreground">
            {ACTION_LABELS[step.action]}
          </span>
          <h2 className={`text-3xl ${state === 'done' ? 'text-muted-foreground' : 'text-foreground'}`}>
            {step.title}
          </h2>
        </div>

        <p className="text-base text-muted-foreground max-w-prose">{step.instruction}</p>

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
            <IconBulb size={18} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">{step.tip}</p>
          </div>
        )}
      </motion.section>
    </AnimatePresence>
  )
}
