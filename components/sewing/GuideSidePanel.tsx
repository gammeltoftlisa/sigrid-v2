'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconScissors, IconNeedleThread, IconIroning, IconDroplet, IconCheck, IconChevronDown } from '@tabler/icons-react'
import type { SewingStep2D } from '@/lib/types'
import { groupIntoJourneys, type JourneyKind } from '@/lib/journeys'

const JOURNEY_ICONS: Record<JourneyKind, typeof IconScissors> = {
  prepare: IconDroplet,
  cut:    IconScissors,
  sew:    IconNeedleThread,
  finish: IconIroning,
}

const TOOL_LABELS: Record<string, string> = {
  scissors: '✂️ Scissors',
  pins:     '📌 Pins',
  needle:   '🧵 Machine',
  iron:     '🔥 Iron',
  chalk:    '✏️ Chalk',
  ruler:    '📏 Ruler',
}

const ACTION_COLORS: Record<string, string> = {
  cut:     'bg-[#FDE8E6] text-[#C5574A]',
  sew:     'bg-primary-soft text-primary-deep',
  fold:    'bg-surface-2 text-ink-2',
  pin:     'bg-[#E3EEE3] text-[#4E7D4F]',
  press:   'bg-warn-soft text-warn',
  mark:    'bg-surface-2 text-ink-2',
  prepare: 'bg-surface-2 text-ink-2',
  attach:  'bg-primary-soft text-primary-deep',
}

const ACTION_LABELS: Record<string, string> = {
  cut: 'Cut', sew: 'Sew', fold: 'Fold', pin: 'Pin',
  press: 'Press', mark: 'Mark', prepare: 'Prepare', attach: 'Attach',
}

interface Props {
  steps: SewingStep2D[]
  /** Index of the step currently being worked on — steps before this are done */
  completedUntil: number
  /** Index of the step shown in the canvas (independent of completion) */
  viewStep: number
  isLast: boolean
  onNext: () => void
  onPrev: () => void
  onExit: () => void
  /** Preview a step in the canvas without changing completion status */
  onPreview: (index: number) => void
}

export default function GuideSidePanel({ steps, completedUntil, viewStep, isLast, onNext, onPrev, onExit, onPreview }: Props) {
  const [openStep, setOpenStep] = useState<number>(viewStep)
  const [showTip, setShowTip] = useState(false)
  const activeRef = useRef<HTMLDivElement>(null)
  const journeys = useMemo(() => groupIntoJourneys(steps), [steps])
  const journeyKeyAt = (i: number) => journeys.find((j) => j.stepIndices.includes(i))?.key
  // Start with the journey you're working on open; the rest stay folded
  const [openJourneys, setOpenJourneys] = useState<Set<string>>(() => {
    const k = journeyKeyAt(completedUntil)
    return new Set(k ? [k] : [])
  })

  const openJourneyFor = (i: number) => {
    const k = journeyKeyAt(i)
    if (k) setOpenJourneys((prev) => (prev.has(k) ? prev : new Set(prev).add(k)))
  }

  const toggleJourney = (k: string) =>
    setOpenJourneys((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  // Whatever step is on the canvas should be visible in the list
  useEffect(() => { openJourneyFor(viewStep) }, [viewStep])

  // A journey that was just finished always folds away, and the one now being
  // worked on opens — regardless of which step the user is looking at.
  useEffect(() => {
    const finished = journeys.find((j) => j.stepIndices[j.stepIndices.length - 1] === completedUntil - 1)
    if (!finished) return
    const nextKey = journeyKeyAt(completedUntil)
    setOpenJourneys((prev) => {
      const next = new Set(prev)
      next.delete(finished.key)
      if (nextKey) next.add(nextKey)
      return next
    })
  }, [completedUntil])

  // When completedUntil advances (Mark done pressed), open the new active step
  // only if the user isn't already previewing a different step.
  useEffect(() => {
    if (openStep === completedUntil - 1 || openStep === completedUntil) {
      setOpenStep(completedUntil)
      openJourneyFor(completedUntil)
      setShowTip(false)
      activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [completedUntil])

  const toggle = (i: number) => {
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
    const done    = i < completedUntil
    const active  = i === completedUntil
    const isOpen  = openStep === i

    return (
      <div
        key={s.id}
        ref={active ? activeRef : undefined}
        className={`mb-1 rounded-xl overflow-hidden border transition-colors duration-200 ${
          active   ? 'border-primary/30 bg-primary-soft'
          : done   ? 'border-transparent bg-transparent hover:bg-surface-2'
          :          'border-rim bg-surface'
        }`}
      >
        {/* Row header */}
        <button
          onClick={() => toggle(i)}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
        >
          <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
            done   ? 'bg-primary-soft'
            : active ? 'border-2 border-primary bg-transparent'
            :          'bg-surface-2 border border-rim'
          }`}>
            {done ? (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="var(--sig-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : active ? (
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            ) : (
              <span className="text-[9px] font-bold text-ink-3">{n}</span>
            )}
          </div>

          <span className={`flex-1 text-[13px] leading-tight truncate ${
            done   ? 'text-ink-3/70'
            : active ? 'text-ink font-bold'
            :          'text-ink-3'
          }`}>
            {s.title}
          </span>

          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
            className={`flex-shrink-0 text-ink-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-2.5 pb-3">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block ${ACTION_COLORS[s.action]}`}>
                  {ACTION_LABELS[s.action]}
                </span>

                <p className="text-xs text-ink-2 leading-relaxed mb-2">{s.instruction}</p>

                <div className="flex flex-wrap gap-1 mb-2">
                  {s.measurement && (
                    <span className="text-[11px] font-semibold bg-white/70 text-primary-deep px-1.5 py-0.5 rounded-full">
                      📏 {s.measurement}
                    </span>
                  )}
                  {s.tool && (
                    <span className="text-[11px] font-semibold bg-white/70 text-ink-2 px-1.5 py-0.5 rounded-full">
                      {TOOL_LABELS[s.tool]}
                    </span>
                  )}
                  {s.tip && active && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowTip((v) => !v) }}
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                        showTip ? 'bg-warn text-white' : 'bg-warn-soft text-warn'
                      }`}
                    >
                      💡 Tip
                    </button>
                  )}
                  {s.tip && !active && (
                    <span className="text-[11px] font-semibold bg-warn-soft text-warn px-1.5 py-0.5 rounded-full">
                      💡 {s.tip}
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
                      className="text-[11px] text-ink-2 bg-warn-soft/60 rounded-lg px-2 py-1.5 mb-2 overflow-hidden leading-relaxed"
                    >
                      {s.tip}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Jump back to a done step */}
                {done && (
                  <button
                    onClick={() => onPreview(i)}
                    className="w-full mt-1 py-1.5 rounded-lg border border-rim text-[11px] font-semibold text-ink-2 bg-surface hover:bg-surface-2 transition-colors"
                  >
                    ← View step
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="order-2 md:order-none flex-1 min-h-0 md:flex-none md:w-1/3 md:shrink-0 bg-surface border-t md:border-t-0 md:border-r border-rim flex flex-col overflow-hidden">
      {/* Label + progress count */}
      <div className="px-3 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold text-ink-3 uppercase tracking-widest">Steps</p>
          <p className="text-[11px] font-bold text-primary tabular-nums">
            {completedUntil} / {steps.length}
          </p>
        </div>
        {/* Progress bar — advances only when steps are effectively marked done */}
        <div className="h-0.5 rounded-full bg-rim overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(completedUntil / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Scrollable step list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {journeys.map((j, jIdx) => {
          const doneCount = j.stepIndices.filter((i) => i < completedUntil).length
          const total     = j.stepIndices.length
          const complete  = doneCount === total
          const current   = !complete && j.stepIndices[0] <= completedUntil
          const expanded  = openJourneys.has(j.key)
          const Icon      = JOURNEY_ICONS[j.kind]

          return (
            <div
              key={j.key}
              className={`mb-2 rounded-2xl border overflow-hidden transition-colors ${
                current ? 'border-primary/40' : 'border-rim'
              }`}
            >
              {/* Journey header — expanding only shows steps, never marks progress */}
              <button
                onClick={() => toggleJourney(j.key)}
                aria-expanded={expanded}
                className={`w-full flex items-center gap-2 px-2.5 py-2.5 text-left transition-colors ${
                  current ? 'bg-primary-soft' : 'hover:bg-surface-2'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                  complete ? 'bg-primary text-surface'
                  : current ? 'bg-surface text-primary border border-primary/40'
                  :           'bg-surface-2 text-ink-3'
                }`}>
                  {complete ? (
                    <motion.span
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                      className="flex"
                    >
                      <IconCheck size={14} stroke={3} />
                    </motion.span>
                  ) : <Icon size={15} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-ink-3 uppercase tracking-widest leading-none mb-0.5">
                    Journey {jIdx + 1}
                  </p>
                  <p className={`text-[13px] font-bold leading-tight truncate ${complete ? 'text-ink-3' : 'text-ink'}`}>
                    {j.title}
                  </p>
                </div>
                <span className={`text-[11px] font-bold tabular-nums ${complete || current ? 'text-primary' : 'text-ink-3'}`}>
                  {doneCount}/{total}
                </span>
                <IconChevronDown
                  size={12}
                  className={`flex-shrink-0 text-ink-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
      <div className="shrink-0 border-t border-rim bg-surface px-3 pt-2.5 pb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={viewStep === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:bg-surface-2 active:scale-90 transition-all disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={onNext}
            className="flex-1 h-8 rounded-lg bg-primary text-surface text-sm font-bold active:scale-95 transition-transform"
          >
            {isLast ? 'Finish 🎉' : 'Mark done'}
          </button>

          <button
            onClick={() => !isLast && onPreview(Math.min(viewStep + 1, steps.length - 1))}
            disabled={viewStep >= steps.length - 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary-soft active:scale-90 transition-all disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
