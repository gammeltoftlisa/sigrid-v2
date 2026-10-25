'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { IconCheck } from '@tabler/icons-react'

/**
 * One visual language for progress, used by the step tracker, journeys,
 * guide steps and sub-step lists:
 *
 * - upcoming → neutral: grey circle, readable text, outlined row
 * - active   → strongest: solid amber circle, bold text, the only filled row
 * - done     → recedes: soft amber circle with a check, faded text, no box
 */
export type ProgressState = 'upcoming' | 'active' | 'done'

export const progressStateOf = (index: number, current: number): ProgressState =>
  index < current ? 'done' : index === current ? 'active' : 'upcoming'

const DOT_SIZES = {
  sm: { box: 'size-4',  text: 'text-2xs',  check: 10 },
  md: { box: 'size-7',  text: 'text-2xs', check: 14 },
  lg: { box: 'w-8 h-8',  text: 'text-xs',     check: 14 },
} as const

export function StatusDot({
  state,
  size = 'sm',
  children,
}: {
  state: ProgressState
  size?: keyof typeof DOT_SIZES
  /** Number or icon shown when not done. `sm` active dots show a centre dot instead. */
  children?: ReactNode
}) {
  const s = DOT_SIZES[size]
  return (
    <div
      className={`${s.box} ${s.text} rounded-full shrink-0 flex items-center justify-center font-medium leading-none tabular-nums transition-colors duration-200 ${
        state === 'done'   ? 'bg-accent text-primary'
        : state === 'active' ? 'step-dot-active bg-primary text-primary-foreground'
        :                      'step-dot-upcoming text-muted-foreground'
      }`}
    >
      {state === 'done' ? (
        <motion.span
          key="check"
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 14 }}
          className="flex"
        >
          <IconCheck size={s.check} stroke={3} />
        </motion.span>
      ) : state === 'active' && size === 'sm' ? (
        <span className="size-1.5 rounded-full bg-current" />
      ) : (
        children
      )}
    </div>
  )
}

/**
 * Outer box of an expandable step row. Done rows are frameless while
 * collapsed, but get a quiet neutral frame when opened so their content
 * doesn't float loose in the list.
 */
export const stepRowClass = (state: ProgressState, open = false) =>
  `step-row rounded-(--control-radius) overflow-hidden transition-colors duration-150 ${
    state === 'active' ? 'step-row-active' : open ? '' : 'glass-inset-hover'
  } ${open ? 'step-row-open' : ''}`

/** Title text of a step row or journey. */
export const stepTextClass = (state: ProgressState) =>
  state === 'active' ? 'text-foreground font-medium'
  : state === 'done' ? 'text-muted-foreground'
  :                    'text-foreground'
