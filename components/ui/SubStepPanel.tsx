'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GARMENT_STEPS, type StepKey } from './StepTracker'
import GarmentIllustration from './GarmentIllustration'

interface Props {
  current: StepKey
  activeSubStep?: number
  onNext?: () => void
  onPrev?: () => void
  onExit?: () => void
  isLast?: boolean
  garmentName?: string
}

export default function SubStepPanel({ current, activeSubStep, onNext, onPrev, onExit, isLast, garmentName }: Props) {
  const step = GARMENT_STEPS.find((s) => s.key === current)!
  const [openStep, setOpenStep] = useState<number | null>(activeSubStep ?? 0)

  // Keep open step in sync when activeSubStep changes
  useEffect(() => {
    if (activeSubStep !== undefined) setOpenStep(activeSubStep)
  }, [activeSubStep])

  const toggle = (i: number) => setOpenStep((prev) => (prev === i ? null : i))

  return (
    <div className="w-1/3 shrink-0 bg-surface border-r border-rim flex flex-col overflow-hidden">
      {/* Garment illustration */}
      {garmentName && (
        <div className="px-4 pt-4 pb-3 shrink-0 flex items-center justify-center border-b border-rim">
          <GarmentIllustration name={garmentName} className="w-20 h-20" />
        </div>
      )}
      {/* Label */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <p className="text-[11px] font-bold text-ink-3 uppercase tracking-widest">Steps</p>
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {step.subSteps.map((sub, i) => {
          const isDone   = activeSubStep !== undefined && i < activeSubStep
          const isActive = activeSubStep === i
          const isOpen   = openStep === i

          return (
            <div
              key={sub}
              className={`mb-1 rounded-xl overflow-hidden border transition-colors duration-200 ${
                isActive ? 'border-primary/30 bg-primary-soft'
                : isDone  ? 'border-rim bg-surface-2'
                :            'border-rim bg-surface'
              }`}
            >
              {/* Row header — clickable to expand/collapse */}
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
              >
                {/* Circle */}
                <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                  isDone   ? 'bg-primary border border-primary'
                  : isActive ? 'border-2 border-primary bg-transparent'
                  :             'bg-surface-2 border border-rim'
                }`}>
                  {isDone ? (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ) : (
                    <span className="text-[9px] font-bold text-ink-3">{i + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span className={`flex-1 text-[13px] leading-tight truncate ${
                  isDone   ? 'text-ink-3 line-through'
                  : isActive ? 'text-ink font-bold'
                  :             'text-ink-3'
                }`}>
                  {sub}
                </span>

                {/* Chevron */}
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
                    <div className="px-2.5 pb-3 pt-0.5">
                      <span className="text-[11px] text-ink-3 leading-relaxed">
                        {isActive ? 'Currently active' : isDone ? 'Completed' : 'Up next'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Sticky bottom navigation — < Next > */}
      {onNext && (
        <div className="shrink-0 border-t border-rim bg-surface px-3 pt-2.5 pb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:bg-surface-2 active:scale-90 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              onClick={onNext}
              className="flex-1 h-8 rounded-lg bg-primary text-surface text-sm font-bold active:scale-95 transition-transform"
            >
              {isLast ? 'Finish' : 'Continue'}
            </button>

            <div className="w-8" />
          </div>
        </div>
      )}
    </div>
  )
}
