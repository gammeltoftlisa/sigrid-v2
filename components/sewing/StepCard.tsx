'use client'

import { motion, AnimatePresence } from 'motion/react'
import { IconArrowBackUp, IconBulb, IconCheck, IconChevronLeft, IconChevronRight, IconConfetti, IconRuler2 } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/patterns/status-badge'
import { ease } from '@/components/patterns/reveal'
import type { JourneySection } from '@/lib/journeys'
import type { SewingStep2D } from '@/lib/types'
import { progressStateOf } from '@/components/legacy/progress'
import { StageProgress } from './StageProgress'
import { ACTION_LABELS } from './actions'
import { TOOLS } from './tools'

/**
 * The step you're on, and everything about it in one place, so your eyes never leave it: where you are (the stage,
 * the step number, a progress line cut into stages), what to do (the title and the instruction in reading size),
 * what to measure and which tool, the tip, what comes next, and the buttons right under it.
 *
 * Looking at another step is never the same as finishing one: the card says it's done or still to come, and the
 * main button takes you back to the step you're on instead of marking anything.
 *
 * The card fills its column, so the buttons sit in the same place on every step however long the instruction is.
 */
export default function StepCard({
  steps,
  journeys,
  viewStep,
  completedUntil,
  garmentName,
  onNext,
  onPreview,
}: {
  steps: SewingStep2D[]
  journeys: JourneySection[]
  viewStep: number
  completedUntil: number
  garmentName: string
  /** Mark the step you're on done (or open the summary when everything is) */
  onNext: () => void
  /** Show a step without changing progress */
  onPreview: (index: number) => void
}) {
  const total = steps.length
  const allDone = completedUntil >= total
  const step = steps[Math.min(viewStep, total - 1)]
  const state = progressStateOf(viewStep, completedUntil)
  const viewingOther = !allDone && viewStep !== completedUntil
  const journey = journeys.find((j) => j.stepIndices.includes(viewStep))
  const inJourney = journey ? journey.stepIndices.indexOf(viewStep) + 1 : 1
  const tool = step.tool ? TOOLS[step.tool] : null
  const next = !viewingOther && !allDone ? steps[completedUntil + 1] : undefined
  const isLast = completedUntil === total - 1

  return (
    <section aria-label="This step" className="glass-panel step-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-(--radius) border">
      {/* Where you are */}
      <header className="container-head flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow min-w-0 truncate text-muted-foreground">
            {allDone ? 'Finished' : `${journey?.title ?? 'Step'}${journey && journey.stepIndices.length > 1 ? ` · ${inJourney} of ${journey.stepIndices.length}` : ''}`}
          </p>
          <p className="shrink-0 text-xs font-medium text-brand-ink tabular-nums">{allDone ? `${total} of ${total}` : `Step ${viewStep + 1} of ${total}`}</p>
        </div>
        <StageProgress journeys={journeys} completedUntil={completedUntil} total={total} />
      </header>

      {/* What to do: the only part that scrolls, when an instruction is long */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={allDone ? 'done' : viewStep}
            aria-live="polite"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease }}
            className="flex flex-col gap-3"
          >
            {allDone ? (
              <>
                <h2 className="title-lg">{garmentName} is <em className="display-italic">finished</em>.</h2>
                <p className="text-base text-muted-foreground">All {total} steps are done. Take a moment to enjoy it.</p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status="neutral">{ACTION_LABELS[step.action]}</StatusBadge>
                  {state === 'done' && <StatusBadge status="success">Done</StatusBadge>}
                  {state === 'upcoming' && <StatusBadge status="neutral">Still to come</StatusBadge>}
                </div>
                <h2 className={`title-lg ${state === 'done' ? 'text-muted-foreground' : ''}`}>{step.title}</h2>
                <p className="max-w-prose text-base leading-relaxed">{step.instruction}</p>

                {(step.measurement || tool) && (
                  <ul className="flex flex-wrap gap-2">
                    {step.measurement && (
                      <li className="step-fact">
                        <IconRuler2 aria-hidden />
                        {step.measurement}
                      </li>
                    )}
                    {tool && (
                      <li className="step-fact">
                        <tool.Icon aria-hidden />
                        {tool.label}
                      </li>
                    )}
                  </ul>
                )}

                {step.tip && (
                  <aside className="step-tip">
                    <IconBulb aria-hidden />
                    <p><span className="font-medium">Tip: </span>{step.tip}</p>
                  </aside>
                )}

                {next && (
                  <button type="button" data-control onClick={() => onPreview(completedUntil + 1)} className="step-next">
                    <span className="eyebrow text-muted-foreground">Next</span>
                    <span className="min-w-0 truncate">{next.title}</span>
                    <IconChevronRight aria-hidden className="ml-auto size-4 shrink-0 text-muted-foreground" />
                  </button>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* What to do about it, right under what you read */}
      <footer className="flex items-center gap-2 border-t p-3">
        {!allDone && (
          <Button variant="outline" size="icon-lg" onClick={() => onPreview(viewStep - 1)} disabled={viewStep === 0} aria-label="Previous step">
            <IconChevronLeft />
          </Button>
        )}
        {viewingOther ? (
          <Button variant="outline" size="lg" className="flex-1" onClick={() => onPreview(completedUntil)}>
            <IconArrowBackUp data-icon="inline-start" />
            Back to step {completedUntil + 1}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={onNext}>
            {allDone ? <IconConfetti data-icon="inline-start" /> : <IconCheck data-icon="inline-start" stroke={2.5} />}
            {allDone ? 'View summary' : isLast ? 'Finish' : 'Mark done'}
          </Button>
        )}
        {!allDone && (
          <Button variant="outline" size="icon-lg" onClick={() => onPreview(viewStep + 1)} disabled={viewStep >= total - 1} aria-label="Next step">
            <IconChevronRight />
          </Button>
        )}
      </footer>
    </section>
  )
}
