'use client'

import { motion, AnimatePresence } from 'motion/react'
import { IconBulb, IconRuler2 } from '@tabler/icons-react'
import { Panel } from '@/components/patterns/panel'
import { StatusBadge } from '@/components/patterns/status-badge'
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

  // The panel stays put and only its content changes: fading a glass surface makes it flicker
  return (
    <Panel
      label={`${journeyTitle ? `${journeyTitle} · ` : ''}Step ${numberInJourney} of ${journeyLength}`}
      meta={state === 'done' ? 'Done' : state === 'upcoming' ? 'Coming up' : undefined}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          aria-live="polite"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease }}
          className="flex flex-col gap-2 px-1"
        >
          <div className="flex items-baseline gap-3">
            <StatusBadge status="neutral">{ACTION_LABELS[step.action]}</StatusBadge>
            <h2 className={`title-lg ${state === 'done' ? 'text-muted-foreground' : 'text-foreground'}`}>{step.title}</h2>
          </div>

          <p className="max-w-prose text-base text-muted-foreground">{step.instruction}</p>

          {(step.measurement || tool) && (
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {step.measurement && (
                <li className="flex items-center gap-1.5">
                  <IconRuler2 className="size-4 text-muted-foreground" aria-hidden />
                  {step.measurement}
                </li>
              )}
              {tool && (
                <li className="flex items-center gap-1.5">
                  <tool.Icon className="size-4 text-muted-foreground" aria-hidden />
                  {tool.label}
                </li>
              )}
            </ul>
          )}

          {step.tip && (
            <div className="mt-1 flex items-start gap-2 text-sm">
              <IconBulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <p>{step.tip}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Panel>
  )
}
