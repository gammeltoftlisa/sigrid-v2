'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BodySilhouette from '@/components/ui/BodySilhouette'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'
import StepTracker from '@/components/ui/StepTracker'
import SubStepPanel from '@/components/ui/SubStepPanel'
import { getGarmentById, standardSizes, type StandardSize } from '@/lib/data'
import { useFlow } from '@/lib/flow-context'


type MeasurementField = 'bust' | 'waist' | 'hips' | 'height' | 'inseam'
type Recipient = 'myself' | 'someone'

const fields: { key: MeasurementField; label: string }[] = [
  { key: 'bust',   label: 'Bust'   },
  { key: 'waist',  label: 'Waist'  },
  { key: 'hips',   label: 'Hips'   },
  { key: 'height', label: 'Height' },
  { key: 'inseam', label: 'Inseam' },
]

const savedMeasurements = { bust: 88, waist: 70, hips: 96, height: 168, inseam: 78 }
const SIZE_KEYS: StandardSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function MeasurementsStep({ garmentId, onClose }: { garmentId: string; onClose: () => void }) {
  const { completeStep } = useFlow()
  const garment = getGarmentById(garmentId)

  const [recipient, setRecipient] = useState<Recipient>('myself')
  const [recipientName, setRecipientName] = useState('')
  const [selectedSize, setSelectedSize] = useState<StandardSize | null>(null)
  const [showExact, setShowExact] = useState(false)
  const [measurements, setMeasurements] = useState<Partial<Record<MeasurementField, number>>>(savedMeasurements)
  const [activeField, setActiveField] = useState<MeasurementField | null>(null)
  const [editing, setEditing] = useState(false)

  const filledCount = fields.filter((f) => measurements[f.key] !== undefined).length

  const switchRecipient = (r: Recipient) => {
    setRecipient(r)
    if (r === 'myself') {
      setMeasurements(savedMeasurements)
      setRecipientName('')
      setSelectedSize(null)
      setShowExact(false)
    } else {
      setMeasurements({})
      setSelectedSize(null)
    }
  }

  const pickSize = (size: StandardSize) => {
    setSelectedSize(size)
    setMeasurements(standardSizes[size])
  }

  const setValue = (field: MeasurementField, raw: string) => {
    const n = parseFloat(raw)
    setSelectedSize(null)
    setMeasurements((prev) => ({ ...prev, [field]: isNaN(n) ? undefined : n }))
  }

  const handleConfirm = () => {
    sessionStorage.setItem('sigrid_measurements', JSON.stringify(measurements))
    sessionStorage.setItem('sigrid_recipient_name', recipient === 'someone' ? recipientName : '')
    completeStep('pattern')
  }

  const displayName = recipientName.trim() || 'Their'

  const heading = recipient === 'myself'
    ? (filledCount > 0 ? 'Your measurements' : 'Add your measurements')
    : (filledCount > 0 ? `${displayName} measurements` : 'Add their measurements')

  const subheading = recipient === 'myself'
    ? (filledCount > 0
        ? 'Check these look right before we generate your pattern.'
        : 'We need these to generate a pattern that fits you perfectly.')
    : (selectedSize
        ? `Using standard size ${selectedSize} — you can enter exact measurements below if needed.`
        : 'Pick a size or enter their exact measurements.')

  const measurementsCard = (
    <div className="bg-surface rounded-3xl p-5 mb-4 shadow-soft">
      <div className="flex gap-4">
        <div className="w-28 flex-shrink-0 flex items-center justify-center">
          <BodySilhouette activeField={activeField} measurements={measurements} className="h-52" />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-caption font-semibold text-ink-2">{f.label}</label>
              {editing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={measurements[f.key] ?? ''}
                    placeholder="—"
                    onFocus={() => setActiveField(f.key)}
                    onBlur={() => setActiveField(null)}
                    onChange={(e) => setValue(f.key, e.target.value)}
                    className={`flex-1 px-3 py-2.5 rounded-xl border text-label text-ink bg-bg placeholder:text-ink-3 focus:outline-none transition-all ${
                      activeField === f.key ? 'border-primary ring-2 ring-primary/20' : 'border-rim'
                    }`}
                  />
                  <span className="text-caption text-ink-3 w-6 text-center">cm</span>
                </div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setEditing(true); setActiveField(f.key) }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                    measurements[f.key] ? 'border-success bg-success-soft' : 'border-rim bg-surface-2'
                  }`}
                >
                  <span className={`text-label font-medium ${measurements[f.key] ? 'text-success' : 'text-ink-3'}`}>
                    {measurements[f.key] ? `${measurements[f.key]} cm` : 'Tap to add'}
                  </span>
                  {measurements[f.key] && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 7L9 18L4 13" stroke="var(--sig-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="mt-4 w-full py-3 rounded-2xl border border-rim text-label font-semibold text-ink-2"
        >
          Edit measurements
        </button>
      )}
      {editing && (
        <button
          onClick={() => setEditing(false)}
          className="mt-4 w-full py-3 rounded-2xl bg-surface-2 text-label font-semibold text-ink-2"
        >
          Done editing
        </button>
      )}
    </div>
  )

  return (
    <>
      <StepTracker
        current="measurements"
        garmentId={garmentId}
        garmentName={garment.name}
        stepProgress={filledCount / fields.length}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-5 pb-4">
              {/* Recipient toggle */}
              <p className="text-caption font-semibold text-ink-3 uppercase tracking-wide mb-2">Who is this for?</p>
              <div className="flex gap-2 mb-5">
                {(['myself', 'someone'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRecipient(r)}
                    className={`flex-1 py-2.5 rounded-2xl text-label font-semibold transition-all duration-200 ${
                      recipient === r ? 'bg-primary text-white shadow-sm' : 'bg-surface-2 text-ink-2'
                    }`}
                  >
                    {r === 'myself' ? 'Myself' : 'Someone else'}
                  </button>
                ))}
              </div>

              <h1 className="text-title font-bold text-ink mb-1">{heading}</h1>
              <p className="text-body text-ink-2">{subheading}</p>
            </div>

            <div className="px-5">
              {recipient === 'myself' ? (
                <>
                  {measurementsCard}
                  <div className="flex flex-col gap-3 pb-12">
                    <PrimaryButton onClick={handleConfirm}>These measurements look right ✓</PrimaryButton>
                    <SecondaryButton variant="ghost" onClick={handleConfirm}>Continue without measuring</SecondaryButton>
                  </div>
                </>
              ) : (
                <>
                  {/* Name field */}
                  <div className="mb-5">
                    <label className="text-caption font-semibold text-ink-2 block mb-1.5">Their name (optional)</label>
                    <input
                      type="text"
                      value={recipientName}
                      placeholder="e.g. Emma"
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-rim bg-surface text-label text-ink placeholder:text-ink-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  {/* Size picker */}
                  <div className="mb-5">
                    <p className="text-caption font-semibold text-ink-2 mb-2">Their size</p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {SIZE_KEYS.map((size) => (
                        <button
                          key={size}
                          onClick={() => pickSize(size)}
                          className={`py-2.5 rounded-2xl text-label font-semibold transition-all duration-150 ${
                            selectedSize === size
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-surface-2 text-ink-2 border border-rim'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exact measurements accordion */}
                  <button
                    onClick={() => setShowExact((v) => !v)}
                    className="flex items-center gap-2 text-label font-semibold text-ink-2 mb-4"
                  >
                    <motion.span
                      animate={{ rotate: showExact ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      className="inline-block leading-none"
                    >
                      ▾
                    </motion.span>
                    Or enter exact measurements
                  </button>

                  <AnimatePresence initial={false}>
                    {showExact && (
                      <motion.div
                        key="exact"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        {measurementsCard}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col gap-3 pb-12 mt-2">
                    <PrimaryButton
                      onClick={handleConfirm}
                      disabled={filledCount === 0 && selectedSize === null}
                    >
                      {selectedSize
                        ? `Use size ${selectedSize} ✓`
                        : filledCount > 0
                          ? 'These measurements look right ✓'
                          : 'Select a size to continue'}
                    </PrimaryButton>
                    <SecondaryButton variant="ghost" onClick={handleConfirm}>Continue without measuring</SecondaryButton>
                  </div>
                </>
              )}
            </div>
      </div>
    </>
  )
}
