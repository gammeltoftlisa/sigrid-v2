'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconScissors, IconPinned, IconNeedleThread, IconIroning, IconPencil, IconRuler,
  IconRulerMeasure, IconBulb, IconYarn,
  type Icon as TablerIcon,
} from '@tabler/icons-react'
import { getGarmentById, getGarmentGuide } from '@/lib/data'
import type { UserMeasurements, SewingStep2D } from '@/lib/types'
import PatternCanvas from '@/components/sewing/PatternCanvas'
import JoinCanvas from '@/components/sewing/JoinCanvas'
import StepTracker from '@/components/ui/StepTracker'
import { useFlow } from '@/lib/flow-context'

const DEFAULT_MEASUREMENTS: UserMeasurements = {
  bust: 88, waist: 70, hips: 96, height: 168, inseam: 78,
}

const TOOL_ICONS: Record<string, TablerIcon> = {
  scissors: IconScissors,
  pins:     IconPinned,
  needle:   IconNeedleThread,
  iron:     IconIroning,
  chalk:    IconPencil,
  ruler:    IconRuler,
}

const TOOL_LABELS: Record<string, string> = {
  scissors: 'Scissors',
  pins:     'Pins',
  needle:   'Machine',
  iron:     'Iron',
  chalk:    'Chalk',
  ruler:    'Ruler',
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

const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

interface StepGroup {
  name: string
  startIndex: number
  steps: SewingStep2D[]
}

function groupSteps(steps: SewingStep2D[]): StepGroup[] {
  const groups: StepGroup[] = []
  steps.forEach((s, i) => {
    const last = groups[groups.length - 1]
    if (last && last.name === s.group) {
      last.steps.push(s)
    } else {
      groups.push({ name: s.group, startIndex: i, steps: [s] })
    }
  })
  return groups
}

function GuideNav({ onPrev, onNext, onPeekNext, isLast, stepIndex, total }: {
  onPrev: () => void
  onNext: () => void
  /** View the next step without marking the current one done — pure browsing,
   *  mirrors onPrev. Only "Done, next step"/"Finish" actually completes a step. */
  onPeekNext: () => void
  isLast: boolean
  stepIndex: number
  total: number
}) {
  const atEnd = stepIndex >= total - 1
  return (
    <div className="shrink-0 px-4 pt-3 pb-5 border-t border-rim bg-bg">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onPrev}
          className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center shrink-0 active:scale-90 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="var(--sig-ink-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onNext}
          className="flex-1 h-11 rounded-full bg-primary text-surface text-label font-semibold active:scale-95 transition-transform shadow-soft"
        >
          {isLast ? 'Finish 🎉' : 'Done, next step'}
        </button>
        <button
          onClick={onPeekNext}
          disabled={atEnd}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
            atEnd ? 'bg-surface-2 opacity-40' : 'bg-surface-2 active:scale-90'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="var(--sig-ink-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="text-center text-caption text-ink-3">
        Step {stepIndex + 1} of {total}
      </p>
    </div>
  )
}

/** The grouped step accordion itself — same look everywhere it appears (desktop rail,
 *  mobile "all steps" overlay): each group is a rounded card that expands to show its
 *  steps, with the active step's full tags + instruction inline. When `onSelectStep`
 *  is given, tapping a step row jumps straight to it (used by the mobile overlay);
 *  without it, rows are informational only and just expand/collapse their group (used
 *  by the desktop rail, where advancing only ever happens via the Prev/Next controls). */
function GroupAccordionList({ groups, stepIndex, furthestStepIndex, onSelectStep }: {
  groups: StepGroup[]
  stepIndex: number
  /** Done/checkmark state tracks this, not stepIndex — peeking ahead with the forward
   *  arrow moves the view without completing anything. */
  furthestStepIndex: number
  onSelectStep?: (idx: number) => void
}) {
  const activeGroupIdx = groups.findIndex(
    (g) => stepIndex >= g.startIndex && stepIndex < g.startIndex + g.steps.length
  )
  const [openGroupIdx, setOpenGroupIdx] = useState<number | null>(activeGroupIdx)
  const [syncedGroupIdx, setSyncedGroupIdx] = useState(activeGroupIdx)
  if (activeGroupIdx !== syncedGroupIdx) {
    setSyncedGroupIdx(activeGroupIdx)
    setOpenGroupIdx(activeGroupIdx)
  }

  return (
    <>
      {groups.map((group, gi) => {
        const groupDone = group.startIndex + group.steps.length - 1 < furthestStepIndex
        const groupActive = gi === activeGroupIdx
        const isOpen = openGroupIdx === gi

        return (
          <div
            key={group.name + gi}
            className={`mb-1.5 rounded-2xl overflow-hidden border transition-colors duration-200 ${
              groupActive ? 'border-primary/30 bg-primary-soft'
              : groupDone  ? 'border-rim bg-surface-2'
              :              'border-rim bg-surface'
            }`}
          >
            <button
              onClick={() => setOpenGroupIdx((prev) => (prev === gi ? null : gi))}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
            >
              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                groupDone   ? 'bg-primary border border-primary'
                : groupActive ? 'border-2 border-primary bg-transparent'
                :               'bg-surface-2 border border-rim'
              }`}>
                {groupDone ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : groupActive ? (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                ) : (
                  <span className="text-[10px] font-bold text-ink-3">{gi + 1}</span>
                )}
              </div>

              <span className={`flex-1 text-[13px] leading-tight ${
                groupDone   ? 'text-ink-3'
                : groupActive ? 'text-ink font-bold'
                :               'text-ink-3'
              }`}>
                {group.name}
              </span>

              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                className={`flex-shrink-0 text-ink-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-2.5 pt-0.5 flex flex-col gap-1">
                    {group.steps.map((s, si) => {
                      const idx = group.startIndex + si
                      const done = idx < furthestStepIndex
                      const active = idx === stepIndex
                      const ToolIcon = s.tool ? TOOL_ICONS[s.tool] : undefined
                      const rowClass = `rounded-xl px-2 py-1.5 ${active ? 'bg-surface shadow-soft' : ''} ${onSelectStep ? 'w-full text-left' : ''}`
                      const rowContent = (
                        <>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              done || active ? 'bg-primary' : 'bg-rim'
                            }`} />
                            <span className={`text-[12px] flex-1 leading-tight ${
                              done   ? 'text-ink-3 line-through'
                              : active ? 'text-ink font-semibold'
                              :          'text-ink-3'
                            }`}>
                              {s.title}
                            </span>
                          </div>

                          {active && (
                            <div className="mt-2 pl-3.5">
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[s.action] ?? 'bg-surface-2 text-ink-2'}`}>
                                  {ACTION_LABELS[s.action] ?? s.action}
                                </span>
                                {s.tool && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-surface-2 text-ink-2 px-2 py-0.5 rounded-full">
                                    {ToolIcon && <ToolIcon size={11} />}
                                    {TOOL_LABELS[s.tool] ?? s.tool}
                                  </span>
                                )}
                                {s.measurement && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-primary-soft text-primary-deep px-2 py-0.5 rounded-full">
                                    <IconRulerMeasure size={11} />
                                    {s.measurement}
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-ink-2 leading-relaxed text-left">{s.instruction}</p>
                              {s.tip && <TipSection tip={s.tip} />}
                            </div>
                          )}
                        </>
                      )
                      return onSelectStep ? (
                        <button key={s.id} onClick={() => onSelectStep(idx)} className={rowClass}>
                          {rowContent}
                        </button>
                      ) : (
                        <div key={s.id} className={rowClass}>
                          {rowContent}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </>
  )
}

/** Desktop-only left rail: wraps GroupAccordionList with a header and the Prev/Next
 *  controls. There's room here to show every group at once; on mobile (see
 *  MobileGroupNav) there isn't, so only the current group's strip is permanent, with
 *  a tap-to-browse overlay reusing this same accordion for the full picture. */
function GroupPanel({ groups, stepIndex, furthestStepIndex, onPrev, onNext, onPeekNext, isLast, total }: {
  groups: StepGroup[]
  stepIndex: number
  furthestStepIndex: number
  onPrev: () => void
  onNext: () => void
  onPeekNext: () => void
  isLast: boolean
  total: number
}) {
  return (
    <div className="hidden md:flex md:w-1/3 md:shrink-0 md:flex-col bg-surface md:border-r border-rim overflow-hidden">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <p className="text-[11px] font-bold text-ink-3 uppercase tracking-widest">Steps</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <GroupAccordionList groups={groups} stepIndex={stepIndex} furthestStepIndex={furthestStepIndex} />
      </div>

      <GuideNav onPrev={onPrev} onNext={onNext} onPeekNext={onPeekNext} isLast={isLast} stepIndex={stepIndex} total={total} />
    </div>
  )
}

/** Mobile-only: a compact "which group, how far into it" strip that sits between the
 *  canvas and the active step's instructions — there isn't room to show every group
 *  permanently on a phone. Tapping the "All steps" chip raises a bottom sheet listing
 *  every group and every step so you can see the whole garment plan and jump straight
 *  to any step you've already reached; drag it down or tap the backdrop to dismiss. */
function MobileGroupNav({ groups, stepIndex, furthestStepIndex, onSelectStep }: {
  groups: StepGroup[]
  stepIndex: number
  furthestStepIndex: number
  onSelectStep: (idx: number) => void
}) {
  const activeGroupIdx = groups.findIndex(
    (g) => stepIndex >= g.startIndex && stepIndex < g.startIndex + g.steps.length
  )
  const group = groups[activeGroupIdx]
  const [browsing, setBrowsing] = useState(false)

  if (!group) return null
  const posInGroup = stepIndex - group.startIndex

  return (
    <>
      <div className="md:hidden shrink-0 px-5 pt-3">
        <button onClick={() => setBrowsing(true)} className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wide shrink-0">
                Group {activeGroupIdx + 1}/{groups.length}
              </span>
              <span className="text-label font-bold text-ink truncate">{group.name}</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary-soft px-2.5 py-1 rounded-full shrink-0">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All steps
            </span>
          </div>
          <div className="flex items-center gap-1">
            {group.steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === posInGroup ? 'flex-1 bg-primary'
                  : group.startIndex + i < furthestStepIndex ? 'w-5 bg-primary'
                  :                                            'w-5 bg-rim'
                }`}
              />
            ))}
          </div>
        </button>
      </div>

      <AnimatePresence>
        {browsing && (
          <>
            <motion.div
              key="sheet-backdrop"
              className="md:hidden absolute inset-0 z-20 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setBrowsing(false)}
            />
            <motion.div
              key="sheet"
              className="md:hidden absolute inset-x-0 bottom-0 z-30 max-h-[75%] rounded-t-3xl bg-bg shadow-modal flex flex-col touch-none"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              drag="y"
              dragMomentum={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) setBrowsing(false)
              }}
            >
              <div className="shrink-0 flex justify-center pt-2.5 pb-1">
                <div className="w-9 h-1 rounded-full bg-rim" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3 border-b border-rim shrink-0">
                <p className="text-label font-bold text-ink">All steps</p>
                <button
                  onClick={() => setBrowsing(false)}
                  className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="var(--sig-ink-2)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                <GroupAccordionList
                  groups={groups}
                  stepIndex={stepIndex}
                  furthestStepIndex={furthestStepIndex}
                  onSelectStep={(idx) => { onSelectStep(idx); setBrowsing(false) }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function TipSection({ tip }: { tip: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-warn"
      >
        <IconBulb size={15} />
        {open ? 'Hide tip' : 'Show tip'}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-2"
          >
            <p className="text-body text-ink-2 bg-warn-soft/60 rounded-2xl px-4 py-3 leading-relaxed">
              {tip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function GuideStep({ garmentId, onClose }: { garmentId: string; onClose: () => void }) {
  const { goToStep, completeStep } = useFlow()
  const garment = getGarmentById(garmentId)
  const guide = getGarmentGuide(garmentId)

  const [stepIndex, setStepIndex] = useState(0)
  // Furthest step actually marked done via "Done, next step"/"Finish" — separate from
  // stepIndex (what's on screen) so the forward-peek arrow can browse ahead without
  // that counting as completing steps you haven't pressed done on.
  const [furthestStepIndex, setFurthestStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [measurements, setMeasurements] = useState<UserMeasurements>(DEFAULT_MEASUREMENTS)
  const [doneAnim, setDoneAnim] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('sigrid_measurements')
      if (raw) setMeasurements({ ...DEFAULT_MEASUREMENTS, ...JSON.parse(raw) })
    } catch {}
  }, [])

  const groups = useMemo(() => (guide ? groupSteps(guide.steps) : []), [guide])

  if (!guide || guide.steps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <IconYarn size={48} className="text-ink-3" stroke={1.5} />
        <h2 className="text-heading font-bold text-ink">Guide coming soon</h2>
        <p className="text-body text-ink-2">The step-by-step guide for this garment is still being crafted.</p>
        <button onClick={onClose} className="mt-4 text-label text-primary font-semibold">← Go back</button>
      </div>
    )
  }

  const steps = guide.steps
  const isLast = stepIndex === steps.length - 1
  const step = steps[stepIndex]
  const piece  = step.pieceId       ? (guide.pieces.find((p) => p.id === step.pieceId)       ?? null) : null
  const piece2 = step.secondPieceId ? (guide.pieces.find((p) => p.id === step.secondPieceId) ?? null) : null
  const ToolIcon = step.tool ? TOOL_ICONS[step.tool] : undefined

  const advance = () => {
    setDoneAnim(true)
    setFurthestStepIndex((f) => Math.max(f, stepIndex + 1))
    setTimeout(() => {
      setDoneAnim(false)
      if (isLast) {
        completeStep('complete')
      } else {
        setDirection(1)
        setStepIndex((i) => i + 1)
      }
    }, 500)
  }

  /** Look at the next step without completing the current one — the forward mirror of
   *  goBack, for "just want to see next step" browsing. */
  const peekNext = () => {
    if (stepIndex >= steps.length - 1) return
    setDirection(1)
    setStepIndex((i) => i + 1)
  }

  const selectStep = (idx: number) => {
    setDirection(idx > stepIndex ? 1 : -1)
    setStepIndex(idx)
  }

  const goBack = () => {
    if (stepIndex === 0) {
      goToStep('materials')
    } else {
      setDirection(-1)
      setStepIndex((i) => i - 1)
    }
  }

  return (
    <>
      <StepTracker
        current="guide"
        garmentId={garmentId}
        garmentName={garment.name}
        stepProgress={furthestStepIndex / steps.length}
        onClose={onClose}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        <GroupPanel
          groups={groups}
          stepIndex={stepIndex}
          furthestStepIndex={furthestStepIndex}
          onPrev={goBack}
          onNext={advance}
          onPeekNext={peekNext}
          isLast={isLast}
          total={steps.length}
        />

        <div className="relative flex-1 flex flex-col overflow-hidden">

        {/* Pattern canvas — fixed height on mobile, fills remaining space on desktop */}
        <div className="relative mx-3 mt-3 md:mx-4 md:mt-4 rounded-3xl overflow-hidden bg-surface-2 shrink-0 h-[40vh] md:h-auto md:flex-1 md:shrink">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="w-full h-full"
            >
              {piece && piece2 ? (
                <JoinCanvas
                  piece1={piece}
                  piece2={piece2}
                  action={step.action}
                  measurements={measurements}
                />
              ) : (
                <PatternCanvas
                  piece={piece}
                  action={step.action}
                  annotation={step.annotation}
                  fabricSide={step.fabricSide}
                  measurements={measurements}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {doneAnim && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-success flex items-center justify-center shadow-modal"
                  initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 1.3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path d="M20 7L9 18L4 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile only: which group + how far into it; tap to browse every group and jump to any step */}
        <MobileGroupNav groups={groups} stepIndex={stepIndex} furthestStepIndex={furthestStepIndex} onSelectStep={selectStep} />

        {/* Instruction — mobile only; on desktop this lives inline in the grouped step list on the left */}
        <div className="md:hidden flex-1 overflow-y-auto px-5 pt-3 min-h-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ACTION_COLORS[step.action] ?? 'bg-surface-2 text-ink-2'}`}>
                  {ACTION_LABELS[step.action] ?? step.action}
                </span>
                {step.tool && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-surface-2 text-ink-2 px-2.5 py-1 rounded-full">
                    {ToolIcon && <ToolIcon size={13} />}
                    {TOOL_LABELS[step.tool] ?? step.tool}
                  </span>
                )}
                {step.measurement && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-primary-soft text-primary-deep px-2.5 py-1 rounded-full">
                    <IconRulerMeasure size={13} />
                    {step.measurement}
                  </span>
                )}
              </div>

              <h2 className="text-title font-bold text-ink mb-3">{step.title}</h2>
              <p className="text-body text-ink-2 leading-relaxed mb-4">{step.instruction}</p>
              {step.tip && <TipSection tip={step.tip} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom navigation — mobile only; on desktop this lives at the bottom of the grouped step list on the left */}
        <div className="md:hidden">
          <GuideNav onPrev={goBack} onNext={advance} onPeekNext={peekNext} isLast={isLast} stepIndex={stepIndex} total={steps.length} />
        </div>

        </div>
      </div>
    </>
  )
}
