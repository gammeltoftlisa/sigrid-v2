'use client'

import { IconCheck } from '@tabler/icons-react'
import { cn } from 'cn'

import type { WizardStep } from '@/lib/studio/wizard'

/**
 * The maker's steps across the top: done ones get a tick, the current one is
 * solid. Any step can be opened; opening one never marks it done.
 */
export function WizardStepper({
  steps,
  current,
  isDone,
  onSelect,
}: {
  steps: { id: WizardStep; short: string }[]
  current: WizardStep
  isDone: (id: WizardStep) => boolean
  onSelect: (id: WizardStep) => void
}) {
  return (
    <nav aria-label="Steps to publish" className="scroll-row overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1">
        {steps.map((s, i) => {
          const active = s.id === current
          const done = isDone(s.id)
          return (
            <li key={s.id} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden className={cn('h-0.5 w-4 rounded-full sm:w-8', done || active ? 'bg-foreground/40' : 'bg-foreground/10')} />}
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-label={`${i + 1}. ${s.short}${done ? ", done" : ""}`}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm transition-colors outline-none',
                  active ? 'bg-card font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums',
                    active ? 'bg-primary text-primary-foreground' : done ? 'bg-accent text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done && !active ? <IconCheck className="size-3.5" stroke={2.5} aria-label="Done" /> : i + 1}
                </span>
                <span className={cn(!active && 'hidden xl:inline')}>{s.short}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
