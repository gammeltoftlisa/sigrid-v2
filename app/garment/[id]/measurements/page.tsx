'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import BodySilhouette from '@/components/ui/BodySilhouette'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'
import StepTracker from '@/components/ui/StepTracker'
import SubStepPanel from '@/components/ui/SubStepPanel'
import { getGarmentById } from '@/lib/data'

type MeasurementField = 'bust' | 'waist' | 'hips' | 'height' | 'inseam'

const fields: { key: MeasurementField; label: string; hint: string }[] = [
  { key: 'bust',   label: 'Bust',   hint: 'Around fullest part of chest' },
  { key: 'waist',  label: 'Waist',  hint: 'Around natural waistline'     },
  { key: 'hips',   label: 'Hips',   hint: 'Around fullest part of hips'  },
  { key: 'height', label: 'Height', hint: 'Head to floor'                },
  { key: 'inseam', label: 'Inseam', hint: 'Crotch to ankle'              },
]

const savedMeasurements = { bust: 88, waist: 70, hips: 96, height: 168, inseam: 78 }

export default function MeasurementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const garment = getGarmentById(id)
  const [measurements, setMeasurements] = useState<Partial<Record<MeasurementField, number>>>(savedMeasurements)
  const [activeField, setActiveField] = useState<MeasurementField | null>(null)
  const [editing, setEditing] = useState(false)

  const filledCount = fields.filter((f) => measurements[f.key] !== undefined).length
  const hasMeasurements = filledCount > 0
  const [exiting, setExiting] = useState(false)
  const [animateIn] = useState(() => {
    if (typeof window === 'undefined') return false
    const flag = sessionStorage.getItem('sigrid_flow_enter')
    if (flag) { sessionStorage.removeItem('sigrid_flow_enter'); return true }
    return false
  })

  const handleClose = () => setExiting(true)

  const setValue = (field: MeasurementField, raw: string) => {
    const n = parseFloat(raw)
    setMeasurements((prev) => ({ ...prev, [field]: isNaN(n) ? undefined : n }))
  }

  const handleConfirm = () => {
    sessionStorage.setItem('sigrid_measurements', JSON.stringify(measurements))
    router.push(`/garment/${id}/materials`)
  }

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 top-3 flex flex-col bg-bg rounded-t-3xl overflow-hidden shadow-modal"
      initial={{ y: animateIn ? '100%' : 0 }}
      animate={{ y: exiting ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      onAnimationComplete={() => { if (exiting) router.push(`/garment/${id}`) }}
    >
      <StepTracker current="measurements" garmentId={id} garmentName={garment.name} stepProgress={filledCount / fields.length} onClose={handleClose} />

      <div className="flex-1 flex flex-row overflow-hidden">
        <SubStepPanel
          current="measurements"
          activeSubStep={filledCount < fields.length ? filledCount : undefined}
          onNext={handleConfirm}
          onPrev={() => router.back()}
          onExit={() => router.push('/home')}
          garmentName={garment.name}
        />

        {/* Right 2/3 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-5 pb-6">
              <h1 className="text-title font-bold text-ink mb-1">
                {hasMeasurements ? 'Your measurements' : 'Add your measurements'}
              </h1>
              <p className="text-body text-ink-2">
                {hasMeasurements
                  ? 'Check these look right before we generate your pattern.'
                  : 'We need these to generate a pattern that fits you perfectly.'}
              </p>
            </div>

            <div className="px-5">
              <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft">
                <div className="flex gap-4">
                  <div className="w-28 flex-shrink-0 flex items-center justify-center">
                    <BodySilhouette
                      activeField={activeField}
                      measurements={measurements}
                      className="h-52"
                    />
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

              <div className="flex flex-col gap-3 pb-12">
                <PrimaryButton onClick={handleConfirm}>
                  These measurements look right ✓
                </PrimaryButton>
                <SecondaryButton variant="ghost" onClick={handleConfirm}>
                  Continue without measuring
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
