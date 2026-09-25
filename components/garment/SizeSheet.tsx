'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX, IconBulb, IconAlertTriangle, IconColorSwatch } from '@tabler/icons-react'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SizePicker from '@/components/ui/SizePicker'
import { standardSizes, tshirtFabrics } from '@/lib/data'
import { sizeLabel } from '@/lib/sizes'
import type { Garment, StandardSize, UserMeasurements } from '@/lib/types'
import IconButton from '@/components/ui/IconButton'

type SizeField = keyof UserMeasurements

const fieldLabels: Record<SizeField, string> = {
  bust: 'Bust', waist: 'Waist', hips: 'Hips', height: 'Height', inseam: 'Inseam',
}

interface Props {
  garment: Garment
  open: boolean
  onClose: () => void
  /** Size selected when the sheet opens (current project size, or the profile size) */
  initialSize: StandardSize | null
  onConfirm: (size: StandardSize) => void
  /**
   * Set when a project is already under way: picking a different size then
   * shows a warning that progress will be reset.
   */
  progress?: { size: StandardSize; done: number; total: number }
}

export default function SizeSheet({ garment, open, onClose, initialSize, onConfirm, progress }: Props) {
  const [size, setSize] = useState<StandardSize | null>(initialSize)
  const fabric = tshirtFabrics[0]

  // Re-sync each time the sheet opens
  useEffect(() => {
    if (open) setSize(initialSize && garment.sizes.includes(initialSize) ? initialSize : null)
  }, [open, initialSize, garment.sizes])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const isChange = !!progress
  const changed = isChange && size !== null && size !== progress.size
  const willReset = changed && progress.done > 0

  const chartFields: SizeField[] = garment.category === 'Bottoms'
    ? ['waist', 'hips', 'inseam']
    : ['bust', 'waist', 'hips']

  const confirmLabel = !size
    ? 'Choose a size to continue'
    : !isChange
      ? `Start sewing in ${sizeLabel(size)}`
      : !changed
        ? `Keep ${sizeLabel(size)}`
        : willReset
          ? `Change to ${sizeLabel(size)} & restart`
          : `Change to ${sizeLabel(size)}`

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-sheet-title"
            className="relative w-full md:max-w-md max-h-[90vh] flex flex-col bg-bg rounded-t-3xl md:rounded-3xl shadow-modal overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          >
            {/* Grab handle (phones) */}
            <div className="md:hidden flex justify-center pt-2.5">
              <div className="w-10 h-1 rounded-full bg-rim" />
            </div>

            <div className="flex items-start justify-between gap-3 px-5 pt-4 md:pt-5">
              <div>
                <h2 id="size-sheet-title" className="text-heading font-bold text-ink">
                  {isChange ? 'Change size' : 'Choose your size'}
                </h2>
                <p className="text-caption text-ink-3 mt-0.5">
                  {isChange
                    ? `You're sewing ${garment.name} in ${sizeLabel(progress.size)}.`
                    : `Your pattern is made in this size. You can change it later, but it restarts the project.`}
                </p>
              </div>
              <IconButton label="Close" onClick={onClose}>
                <IconX size={16} />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
              <SizePicker sizes={garment.sizes} selected={size} onSelect={setSize} current={progress?.size} />

              <div className="mt-4">
                {size ? (
                  <div className="grid grid-cols-3 gap-2">
                    {chartFields.map((f) => (
                      <div key={f} className="bg-surface rounded-2xl px-3 py-3 text-center">
                        <p className="text-caption text-ink-3 mb-0.5">{fieldLabels[f]}</p>
                        <p className="text-label font-semibold text-ink whitespace-nowrap">{standardSizes[size][f]} cm</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-caption text-ink-3">Select a size to see its body measurements.</p>
                )}
              </div>

              {!isChange && size && size === initialSize && (
                <p className="text-caption text-ink-3 mt-3">Your size from your profile.</p>
              )}

              {size && (
                <div className="flex items-center gap-2 mt-3 text-caption text-ink-2">
                  <IconColorSwatch size={16} className="text-ink-3 shrink-0" />
                  {fabric.quantityMeters} m of {fabric.name.toLowerCase()} for {sizeLabel(size)}
                </div>
              )}

              <div className="flex items-start gap-2 mt-3">
                <IconBulb size={16} className="text-ink-3 shrink-0 mt-0.5" />
                <p className="text-caption text-ink-3">Between two sizes? Go for the larger one — it&apos;s easier to take in than let out.</p>
              </div>

              <AnimatePresence initial={false}>
                {willReset && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-2xl bg-warn-soft px-4 py-3">
                      <IconAlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
                      <p className="text-caption text-ink">
                        <span className="font-semibold">This restarts your project.</span>{' '}
                        You&apos;ve done {progress.done} of {progress.total} steps in {sizeLabel(progress.size)}.
                        Your pattern pieces change size, so you&apos;ll start again from the first step.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="shrink-0 px-5 pt-3 pb-6 md:pb-5 border-t border-rim">
              <PrimaryButton
                onClick={() => {
                  if (!size) return
                  if (isChange && !changed) onClose()
                  else onConfirm(size)
                }}
                disabled={!size}
                tone={willReset ? 'warn' : 'primary'}
              >
                {confirmLabel}
              </PrimaryButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
