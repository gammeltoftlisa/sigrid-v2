'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  IconScissors, IconNeedleThread, IconIroning, IconDroplet, IconChevronDown, IconChevronLeft,
  IconChevronRight, IconCheck, IconConfetti, IconArrowBackUp, IconBulb, IconRuler2,
} from '@tabler/icons-react'
import type { SewingStep2D } from '@/lib/types'
import { groupIntoJourneys, type JourneyKind } from '@/lib/journeys'
import { StatusDot, progressStateOf, stepRowClass, stepTextClass, type ProgressState } from '@/components/legacy/progress'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TOOLS } from './tools'
import { ACTION_LABELS } from './actions'
import { ease } from '@/components/patterns/reveal'

const JOURNEY_ICONS: Record<JourneyKind, typeof IconScissors> = {
  prepare: IconDroplet,
  cut:    IconScissors,
  sew:    IconNeedleThread,
  finish: IconIroning,
}


interface Props {
  steps: SewingStep2D[]
  /** Index of the step currently being worked on — steps before this are done */
  completedUntil: number
  /** Index of the step shown in the canvas (independent of completion) */
  viewStep: number
  isLast: boolean
  /** Every step is marked done */
  allDone?: boolean
  onNext: () => void
  onPrev: () => void
  /** Preview a step in the canvas without changing completion status */
  onPreview: (index: number) => void
}

export default function GuideSidePanel({ steps, completedUntil, viewStep, isLast, allDone, onNext, onPrev, onPreview }: Props) {
  const [openStep, setOpenStep] = useState<number>(viewStep)
  const [showTip, setShowTip] = useState(false)
  const activeRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const viewingOther = !allDone && viewStep !== completedUntil
  const journeys = useMemo(() => groupIntoJourneys(steps), [steps])
  const journeyKeyAt = (i: number) => journeys.find((j) => j.stepIndices.includes(i))?.key
  // Only one journey is open at a time — starting with the one you're working on
  const [openJourney, setOpenJourney] = useState<string | null>(() => journeyKeyAt(completedUntil) ?? null)

  const openJourneyFor = (i: number) => {
    const k = journeyKeyAt(i)
    if (k) setOpenJourney(k)
  }

  const toggleJourney = (k: string) => setOpenJourney((prev) => (prev === k ? null : k))

  // Whatever step is on the canvas is also the one open in the list — so the
  // ‹ › arrows (and anything else that moves the canvas) reveal that step here.
  const [prevView, setPrevView] = useState(viewStep)
  if (viewStep !== prevView) {
    setPrevView(viewStep)
    openJourneyFor(viewStep)
    setOpenStep(viewStep)
    setShowTip(false)
  }

  // When completedUntil advances (Mark done pressed): a journey that was just
  // finished folds away and the one now being worked on opens, and the new
  // active step opens unless the user is previewing a different step.
  const [prevDone, setPrevDone] = useState(completedUntil)
  if (completedUntil !== prevDone) {
    setPrevDone(completedUntil)
    if (journeys.some((j) => j.stepIndices[j.stepIndices.length - 1] === completedUntil - 1)) {
      setOpenJourney(journeyKeyAt(completedUntil) ?? null)
    }
    if (openStep === completedUntil - 1 || openStep === completedUntil) {
      setOpenStep(completedUntil)
      openJourneyFor(completedUntil)
      setShowTip(false)
    }
  }

  const firstView = useRef(true)
  useEffect(() => {
    if (firstView.current) { firstView.current = false; return }
    // Wait for the journey/step expand animation before scrolling to it
    const t = setTimeout(() => {
      listRef.current
        ?.querySelector(`[data-step="${viewStep}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 230)
    return () => clearTimeout(t)
  }, [viewStep])

  // Bring the newly active step into view once it has opened
  const firstDone = useRef(true)
  useEffect(() => {
    if (firstDone.current) { firstDone.current = false; return }
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [completedUntil])

  const toggle = (i: number) => {
    // Desktop rows are just a way to pick the step on the canvas — picking the
    // one already shown does nothing (there are no details to fold away)
    if (openStep === i && window.matchMedia('(min-width: 768px)').matches) return
    if (openStep === i) {
      // Collapse — don't change canvas
      setOpenStep(-1)
    } else {
      // Expand — preview this step in the canvas without marking anything done
      setOpenStep(i)
      onPreview(i)
    }
    setShowTip(false)
  }

  const renderStep = (s: SewingStep2D, i: number, n: number) => {
    const state   = progressStateOf(i, completedUntil)
    const active  = state === 'active'
    const isOpen  = openStep === i

    return (
      <div
        key={s.id}
        ref={active ? activeRef : undefined}
        data-step={i}
        className={`mb-1 ${stepRowClass(state, isOpen)}`}
      >
        {/* Row header */}
        <button
          onClick={() => toggle(i)}
          aria-expanded={isOpen}
          aria-current={isOpen ? 'step' : undefined}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
        >
          <StatusDot state={state}>{n}</StatusDot>

          <span className={`flex-1 text-sm leading-tight truncate ${stepTextClass(state)}`}>
            {s.title}
          </span>

          {/* Phones only: on desktop the details live in the instruction panel */}
          <IconChevronDown
            size={12}
            className={`md:hidden flex-shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Expandable details — phones only; desktop shows them once, in the instruction panel */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              className="overflow-hidden md:hidden"
            >
              <div className="px-2.5 pb-3">
                <span className="kicker mb-2 inline-block">
                  {ACTION_LABELS[s.action]}
                </span>

                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{s.instruction}</p>

                <div className="flex flex-wrap gap-1 mb-2">
                  {s.measurement && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-card text-primary px-2 py-0.5 rounded-full">
                      <IconRuler2 size={12} />
                      {s.measurement}
                    </span>
                  )}
                  {s.tool && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-card text-muted-foreground px-2 py-0.5 rounded-full">
                      {(() => { const T = TOOLS[s.tool].Icon; return <T size={12} /> })()}
                      {TOOLS[s.tool].short}
                    </span>
                  )}
                  {s.tip && active && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowTip((v) => !v) }}
                      aria-pressed={showTip}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-150 ${
                        showTip ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
                      }`}
                    >
                      <IconBulb size={12} />
                      Tip
                    </button>
                  )}
                  {s.tip && !active && (
                    <span className="inline-flex items-start gap-1 text-xs font-medium bg-accent text-foreground px-2 py-0.5 rounded-(--control-radius)">
                      <IconBulb size={12} className="shrink-0 mt-px" />
                      {s.tip}
                    </span>
                  )}
                </div>

                <AnimatePresence>
                  {showTip && active && s.tip && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.16 }}
                      className="text-xs text-foreground bg-accent rounded-(--control-radius) px-2 py-1.5 mb-2 overflow-hidden leading-relaxed"
                    >
                      {s.tip}
                    </motion.p>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="glass-panel order-2 md:order-none flex-1 min-h-0 md:flex-none md:w-88 lg:w-96 md:shrink-0 rounded-(--radius) flex flex-col overflow-hidden">
      {/* Label + progress count */}
      <div className="px-3 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="kicker">Steps</p>
          <p className="text-xs font-medium text-muted-foreground tabular-nums">
            {completedUntil} / {steps.length}
          </p>
        </div>
        {/* Progress bar — advances only when steps are effectively marked done */}
        <Progress value={(completedUntil / steps.length) * 100} aria-label="Steps done" />
      </div>

      {/* Scrollable step list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-2 pb-2">
        {journeys.map((j) => {
          const doneCount = j.stepIndices.filter((i) => i < completedUntil).length
          const total     = j.stepIndices.length
          const complete  = doneCount === total
          const current   = !complete && j.stepIndices[0] <= completedUntil
          const jState: ProgressState = complete ? 'done' : current ? 'active' : 'upcoming'
          const expanded  = openJourney === j.key
          const Icon      = JOURNEY_ICONS[j.kind]

          return (
            <div
              key={j.key}
              data-slot="inset"
              className="mb-2 rounded-(--control-radius) overflow-hidden"
            >
              {/* Journey header — expanding only shows steps, never marks progress */}
              <button
                onClick={() => toggleJourney(j.key)}
                aria-expanded={expanded}
                className="glass-inset-hover w-full flex items-center gap-2.5 px-2.5 py-2.5 text-left"
              >
                <StatusDot state={jState} size="md"><Icon size={15} /></StatusDot>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-tight truncate ${stepTextClass(jState)}`}>
                    {j.title}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {doneCount}/{total}
                </span>
                <IconChevronDown
                  size={12}
                  className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pt-1 pb-1">
                      {j.stepIndices.map((i, n) => renderStep(steps[i], i, n + 1))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* ── Sticky bottom navigation — < Mark done > ── */}
      <div className="shrink-0 px-3 pt-1 pb-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-lg" onClick={onPrev} disabled={viewStep === 0} aria-label="Previous step">
            <IconChevronLeft />
          </Button>

          {viewingOther ? (
            // Looking at another step: Mark done would complete a step that's off screen,
            // so the main button takes you back to the one you're on instead.
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

          <Button
            variant="outline"
            size="icon-lg"
            onClick={() => !isLast && onPreview(Math.min(viewStep + 1, steps.length - 1))}
            disabled={viewStep >= steps.length - 1}
            aria-label="Next step"
          >
            <IconChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
