'use client'

import { useState, use } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { tshirtSteps, getGarmentById } from '@/lib/data'
import ProgressBar from '@/components/ui/ProgressBar'
import PrimaryButton from '@/components/ui/PrimaryButton'

const SewingGuide = dynamic(() => import('@/components/three/SewingGuide'), { ssr: false })

const stitchIcons: Record<string, string> = {
  'Straight stitch': '━━━',
  'Stretch stitch': '〰〰',
  'Zigzag stitch': '〈〉',
}

export default function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const garment = getGarmentById(id)
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [completedAnimation, setCompletedAnimation] = useState(false)

  const step = tshirtSteps[currentStep]
  const isLast = currentStep === tshirtSteps.length - 1
  const progressPct = (completed.size / tshirtSteps.length) * 100
  const isStepDone = completed.has(currentStep)

  const markComplete = () => {
    const next = new Set(completed).add(currentStep)
    setCompleted(next)
    setCompletedAnimation(true)

    setTimeout(() => {
      setCompletedAnimation(false)
      if (currentStep < tshirtSteps.length - 1) {
        setCurrentStep((s) => s + 1)
      } else {
        router.push(`/garment/${id}/complete`)
      }
    }, 1200)
  }

  const goNext = () => {
    if (currentStep < tshirtSteps.length - 1) setCurrentStep((s) => s + 1)
  }

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F9F7F4]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3 bg-[#F9F7F4]/90 backdrop-blur-sm z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface shadow-soft flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="var(--sig-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <p className="text-caption font-semibold text-ink-2">{garment.name}</p>
          <p className="text-[12px] text-ink-3">Step {currentStep + 1} of {tshirtSteps.length}</p>
        </div>

        <div className="w-9" />
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <ProgressBar percent={progressPct} height={3} color="bg-primary" />
      </div>

      {/* 3D Canvas - fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        <SewingGuide
          steps={tshirtSteps}
          currentStep={currentStep}
          isCompleted={completed.has(currentStep)}
        />

        {/* Step complete animation overlay */}
        <AnimatePresence>
          {completedAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-24 h-24 rounded-full bg-success shadow-modal flex items-center justify-center">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7L9 18L4 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swipe arrows (prev/next) */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {currentStep > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={goPrev}
              className="w-9 h-9 rounded-full bg-surface/80 backdrop-blur shadow-soft flex items-center justify-center pointer-events-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="var(--sig-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          )}
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {currentStep < tshirtSteps.length - 1 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={goNext}
              className="w-9 h-9 rounded-full bg-surface/80 backdrop-blur shadow-soft flex items-center justify-center pointer-events-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="var(--sig-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom sheet */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="bg-surface rounded-t-[28px] shadow-modal px-6 pt-5 pb-safe-bottom"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 28px)' }}
        >
          {/* Handle */}
          <div className="w-10 h-1 rounded-full bg-rim mx-auto mb-4" />

          <div className="flex items-start justify-between mb-3">
            <h2 className="text-heading font-bold text-ink pr-3">{step.title}</h2>
            {isStepDone && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-success-soft flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7L9 18L4 13" stroke="var(--sig-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>

          <p className="text-body text-ink-2 mb-4 leading-relaxed">{step.description}</p>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-5">
            {step.measurement && (
              <span className="flex items-center gap-1.5 text-caption font-semibold bg-primary-soft text-primary-deep px-3 py-1.5 rounded-full">
                📏 {step.measurement}
              </span>
            )}
            {step.stitchType && (
              <span className="flex items-center gap-1.5 text-caption font-semibold bg-surface-2 text-ink-2 px-3 py-1.5 rounded-full">
                {stitchIcons[step.stitchType] ?? '🧵'} {step.stitchType}
              </span>
            )}
          </div>

          {/* CTA */}
          {isStepDone ? (
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={goPrev}
                  className="flex-1 py-4 rounded-full border border-rim text-label font-semibold text-ink-2"
                >
                  Previous
                </button>
              )}
              <button
                onClick={goNext}
                disabled={currentStep >= tshirtSteps.length - 1}
                className="flex-1 py-4 rounded-full bg-surface-2 text-label font-semibold text-ink-2 disabled:opacity-40"
              >
                {isLast ? 'All done!' : 'Next step'}
              </button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={markComplete}
              className="w-full py-4 rounded-full bg-primary text-surface text-label font-semibold shadow-soft"
            >
              {isLast ? '🎉 Complete my t-shirt!' : 'Mark as complete'}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
