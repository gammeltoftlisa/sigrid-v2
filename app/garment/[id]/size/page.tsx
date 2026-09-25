'use client'

import { useState, useEffect, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  IconColorSwatch, IconLeaf, IconRuler2, IconClock, IconBulb, IconPrinter, IconRoute,
  IconScissors, IconPin, IconNeedleThread, IconIroning, IconPencil, IconShirt,
} from '@tabler/icons-react'
import PrimaryButton from '@/components/ui/PrimaryButton'
import DifficultyBadge from '@/components/ui/DifficultyBadge'
import StepTracker from '@/components/ui/StepTracker'
import SizePicker from '@/components/ui/SizePicker'
import GarmentIllustration from '@/components/ui/GarmentIllustration'
import { getGarmentById, getGarmentGuide, standardSizes, tshirtFabrics } from '@/lib/data'
import { groupIntoJourneys } from '@/lib/journeys'
import { loadSavedSize, sizeLabel } from '@/lib/sizes'
import type { GuidePiece, SewingStep2D, StandardSize, UserMeasurements } from '@/lib/types'

type SizeField = keyof UserMeasurements
type Tool = NonNullable<SewingStep2D['tool']>

const fieldLabels: Record<SizeField, string> = {
  bust: 'Bust',
  waist: 'Waist',
  hips: 'Hips',
  height: 'Height',
  inseam: 'Inseam',
}

const TOOLS: Record<Tool, { label: string; Icon: typeof IconScissors }> = {
  scissors: { label: 'Fabric scissors', Icon: IconScissors },
  pins:     { label: 'Pins',            Icon: IconPin },
  needle:   { label: 'Sewing machine',  Icon: IconNeedleThread },
  iron:     { label: 'Iron',            Icon: IconIroning },
  chalk:    { label: 'Tailor’s chalk',  Icon: IconPencil },
  ruler:    { label: 'Ruler',           Icon: IconRuler2 },
}

const pieceName = (p: GuidePiece) =>
  p.name ?? p.id.charAt(0).toUpperCase() + p.id.slice(1).replace(/-/g, ' ')

const pieceDims = (p: GuidePiece, m: UserMeasurements) => {
  const d = typeof p.dims === 'function' ? p.dims(m) : p.dims
  return `${Math.max(d.topWidth, d.bottomWidth)} × ${d.height} cm`
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-3xl p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-heading font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function SizePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const garment = getGarmentById(id)
  const guide = getGarmentGuide(id)
  const recommendedFabric = tshirtFabrics[0]
  const [size, setSize] = useState<StandardSize | null>(null)
  const [savedSize, setSavedSize] = useState<StandardSize | null>(null)
  const [exiting, setExiting] = useState(false)
  const [animateIn] = useState(() => {
    if (typeof window === 'undefined') return false
    const flag = sessionStorage.getItem('sigrid_flow_enter')
    if (flag) { sessionStorage.removeItem('sigrid_flow_enter'); return true }
    return false
  })

  // Start from the size saved in the profile, if this garment comes in it
  useEffect(() => {
    const saved = loadSavedSize()
    setSavedSize(saved)
    if (saved && garment.sizes.includes(saved)) setSize(saved)
  }, [garment.sizes])

  const journeys = useMemo(() => (guide ? groupIntoJourneys(guide.steps) : []), [guide])
  const tools = useMemo(
    () => (guide ? [...new Set(guide.steps.flatMap((s) => (s.tool ? [s.tool] : [])))] : []),
    [guide],
  )

  // Only show the measurements that matter for this kind of garment
  const chartFields: SizeField[] = garment.category === 'Bottoms'
    ? ['waist', 'hips', 'inseam']
    : ['bust', 'waist', 'hips']

  const handleClose = () => setExiting(true)

  const handlePrint = () => {
    if (!size) return
    sessionStorage.setItem('sigrid_size', size)
    window.open(`/garment/${id}/pattern?print=true`, '_blank')
  }

  const handleConfirm = () => {
    if (!size) return
    sessionStorage.setItem('sigrid_size', size)
    sessionStorage.setItem('sigrid_measurements', JSON.stringify(standardSizes[size]))
    router.push(`/garment/${id}/guide`)
  }

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 top-3 flex flex-col bg-bg rounded-t-3xl overflow-hidden shadow-modal"
      initial={{ y: animateIn ? '100%' : 0 }}
      animate={{ y: exiting ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      onAnimationComplete={() => { if (exiting) router.push(`/garment/${id}`) }}
    >
      <StepTracker current="size" garmentId={id} garmentName={garment.name} stepProgress={size ? 0.5 : 0} onClose={handleClose} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 pt-6 pb-8">

          {/* ── Garment header ── */}
          <header className="flex flex-row gap-4 sm:gap-8 items-start sm:items-center mb-6 sm:mb-8">
            <div className="w-24 h-24 sm:w-56 sm:h-56 shrink-0 bg-surface rounded-2xl sm:rounded-3xl shadow-soft flex items-center justify-center p-3 sm:p-6">
              <GarmentIllustration name={garment.name} className="h-full w-auto max-w-full" />
            </div>
            <div className="min-w-0">
              <p className="text-caption font-semibold text-ink-3 uppercase tracking-widest mb-1">{garment.category}</p>
              <h1 className="text-title font-bold text-ink mb-3">{garment.name}</h1>
              <div className="flex items-center gap-x-4 gap-y-2 flex-wrap mb-3">
                <DifficultyBadge difficulty={garment.difficulty} size="md" />
                <span className="flex items-center gap-1 text-caption text-ink-2">
                  <IconClock size={15} className="text-ink-3" />
                  {garment.estimatedTime}
                </span>
                <span className="flex items-center gap-1 text-caption text-ink-2">
                  <IconShirt size={15} className="text-ink-3" />
                  Sizes {garment.sizes[0]}–{garment.sizes[garment.sizes.length - 1]}
                </span>
                {guide && (
                  <span className="flex items-center gap-1 text-caption text-ink-2">
                    <IconRoute size={15} className="text-ink-3" />
                    {guide.steps.length} steps in {journeys.length} journeys
                  </span>
                )}
              </div>
              <p className="text-body text-ink-2 leading-relaxed max-w-prose">{garment.description}</p>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2 md:items-start">

            {/* ── Left column ── */}
            <div className="flex flex-col gap-6">
              <Card icon={<IconRuler2 size={20} className="text-primary" />} title="Your size">
                <SizePicker sizes={garment.sizes} selected={size} onSelect={setSize} />

                <div className="mt-4">
                  {size ? (
                    <div className="grid grid-cols-3 gap-2">
                      {chartFields.map((f) => (
                        <div key={f} className="bg-surface-2 rounded-2xl px-3 py-3 text-center">
                          <p className="text-caption text-ink-3 mb-0.5">{fieldLabels[f]}</p>
                          <p className="text-label font-semibold text-ink whitespace-nowrap">{standardSizes[size][f]} cm</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-caption text-ink-3">
                      {savedSize && !garment.sizes.includes(savedSize)
                        ? `Your usual size (${sizeLabel(savedSize)}) isn't available for this garment — pick the closest one.`
                        : 'Select a size to see its body measurements.'}
                    </p>
                  )}
                  {size && size === savedSize && (
                    <p className="text-caption text-ink-3 mt-3">Pre-selected from your profile.</p>
                  )}
                </div>

                <div className="flex items-start gap-2 mt-4">
                  <IconBulb size={16} className="text-ink-3 shrink-0 mt-0.5" />
                  <p className="text-caption text-ink-3">Between two sizes? Go for the larger one — it&apos;s easier to take in than let out.</p>
                </div>
              </Card>

              {journeys.length > 0 && (
                <Card icon={<IconRoute size={20} className="text-primary" />} title="Your journey">
                  <ol className="flex flex-col gap-2">
                    {journeys.map((j, i) => (
                      <li key={j.key} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-surface-2 text-[11px] font-bold text-ink-3 flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-label text-ink">{j.title}</span>
                        <span className="text-caption text-ink-3 tabular-nums">{j.stepIndices.length} steps</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="flex flex-col gap-6">
              <Card icon={<IconPrinter size={20} className="text-primary" />} title="Pattern">
                {guide && guide.pieces.length > 0 && (
                  <ul className="flex flex-col divide-y divide-rim-soft mb-4">
                    {guide.pieces.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 py-2">
                        <span className="w-7 h-7 rounded-full bg-primary-soft text-primary text-caption font-bold flex items-center justify-center shrink-0">
                          {p.label}
                        </span>
                        <span className="flex-1 text-label text-ink">{pieceName(p)}</span>
                        {size && (
                          <span className="text-caption text-ink-3 tabular-nums">{pieceDims(p, standardSizes[size])}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-caption text-ink-2 mb-4">
                  {size
                    ? `Printable PDF in ${sizeLabel(size)}. Print at 100% scale so the pieces come out the right size.`
                    : 'Choose a size to print your pattern pieces.'}
                </p>
                <button
                  onClick={handlePrint}
                  disabled={!size}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-rim text-label font-semibold text-ink-2 hover:bg-surface-2 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <IconPrinter size={16} />
                  Print PDF
                </button>
              </Card>

              <Card icon={<IconColorSwatch size={20} className="text-primary" />} title="Materials">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-label font-semibold text-ink">{recommendedFabric.name}</p>
                  {recommendedFabric.isEco && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold bg-success-soft text-success px-2 py-0.5 rounded-full shrink-0">
                      <IconLeaf size={12} />
                      Eco
                    </span>
                  )}
                </div>
                <p className="text-caption text-ink-2 mb-2">{recommendedFabric.description}</p>
                <p className="text-caption text-ink-3">
                  {recommendedFabric.quantityMeters}m needed{size ? ` for size ${sizeLabel(size)}` : ''}
                </p>

                {tools.length > 0 && (
                  <>
                    <h3 className="text-label font-semibold text-ink mt-5 mb-3">What you&apos;ll need</h3>
                    <ul className="grid grid-cols-2 gap-2">
                      {tools.map((t) => {
                        const { label, Icon } = TOOLS[t]
                        return (
                          <li key={t} className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-2">
                            <Icon size={16} className="text-ink-3 shrink-0" />
                            <span className="text-caption text-ink-2">{label}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pinned CTA ── */}
      <div className="shrink-0 border-t border-rim bg-bg px-5 py-4">
        <div className="max-w-5xl mx-auto md:flex md:justify-end">
          <div className="md:w-80">
            <PrimaryButton onClick={handleConfirm} disabled={!size}>
              {size ? `Start sewing in ${sizeLabel(size)}` : 'Choose a size to continue'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
