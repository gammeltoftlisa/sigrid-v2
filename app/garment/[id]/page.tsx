'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getGarmentById, creators } from '@/lib/data'
import DifficultyBadge from '@/components/ui/DifficultyBadge'
import FitBadge from '@/components/ui/FitBadge'
import PrimaryButton from '@/components/ui/PrimaryButton'
import GarmentIllustration from '@/components/ui/GarmentIllustration'
import type { FitType } from '@/lib/types'

const fitPositions: FitType[] = ['Relaxed', 'Regular', 'Fitted', 'Tailored']

function FitSlider({ fits, selected, onSelect }: {
  fits: FitType[]
  selected: FitType
  onSelect: (f: FitType) => void
}) {
  const idx = fitPositions.indexOf(selected)
  const pct = (idx / (fitPositions.length - 1)) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-caption text-ink-3">Relaxed</span>
        <span className="text-caption text-ink-3">Tailored</span>
      </div>
      {/* Track */}
      <div
        className="relative h-2 bg-surface-2 rounded-full cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          const idx = Math.round(ratio * (fitPositions.length - 1))
          const clamped = Math.max(0, Math.min(fitPositions.length - 1, idx))
          if (fits.includes(fitPositions[clamped])) {
            onSelect(fitPositions[clamped])
          }
        }}
      >
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
        <motion.div
          animate={{ left: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary shadow-card border-2 border-surface"
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between">
        {fitPositions.map((f) => (
          <button
            key={f}
            onClick={() => fits.includes(f) && onSelect(f)}
            className={`text-[11px] font-medium transition-colors ${
              f === selected ? 'text-primary font-semibold' : fits.includes(f) ? 'text-ink-3' : 'text-ink-3 opacity-30'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function GarmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const garment = getGarmentById(id)
  const creator = garment.isCreator && garment.creatorId ? creators.find((c) => c.id === garment.creatorId) : null
  const [selectedFit, setSelectedFit] = useState<FitType>(garment.fits?.[0] ?? 'Regular')
  const [following, setFollowing] = useState(false)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Back button */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface shadow-soft flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="var(--sig-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Garment illustration */}
      <div className="mx-5 mb-6 bg-surface rounded-3xl overflow-hidden shadow-soft p-8 aspect-square flex items-center justify-center">
        <GarmentIllustration name={garment.name} className="w-full h-full max-w-56" />
      </div>

      <div className="px-5">
        {/* Name + badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-title font-bold text-ink mb-2">{garment.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <DifficultyBadge difficulty={garment.difficulty} size="md" />
              <FitBadge fit={selectedFit} size="md" />
              <span className="text-caption text-ink-3">⏱ {garment.estimatedTime}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-title font-bold text-primary">€{garment.price}</span>
          </div>
        </div>

        <p className="text-body text-ink-2 mb-6 leading-relaxed">{garment.description}</p>

        {/* Creator section */}
        {creator && (
          <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-surface text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: creator.avatarColor }}
            >
              {creator.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-label font-semibold text-ink">{creator.handle}</p>
                {creator.isCertified && (
                  <span className="text-[10px] font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded-full">
                    ✓ Certified
                  </span>
                )}
              </div>
              <p className="text-caption text-ink-3">{creator.followerCount} followers</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setFollowing((f) => !f)}
              className={`px-4 py-2 rounded-full text-label font-semibold transition-colors duration-200 ${
                following ? 'bg-surface-2 text-ink-2' : 'bg-primary text-surface'
              }`}
            >
              {following ? 'Following' : 'Follow'}
            </motion.button>
          </div>
        )}

        {/* Fit selector (Sigrid base garments) */}
        {!garment.isCreator && garment.fits && garment.fits.length > 1 && (
          <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft">
            <h3 className="text-heading font-semibold text-ink mb-2">Choose your fit</h3>
            <p className="text-caption text-ink-3 mb-5">Drag to adjust how the garment sits on your body</p>
            <div className="flex items-end gap-4 mb-5">
              <div className="w-24 h-24">
                <GarmentIllustration
                  name={garment.name}
                  className="w-full h-full"
                  color={fitPositions.indexOf(selectedFit) > 1 ? 'var(--sig-primary-deep)' : 'var(--sig-primary)'}
                />
              </div>
              <div className="flex-1">
                <FitSlider
                  fits={garment.fits}
                  selected={selectedFit}
                  onSelect={setSelectedFit}
                />
              </div>
            </div>
          </div>
        )}

        {/* What's included */}
        <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft">
          <h3 className="text-heading font-semibold text-ink mb-4">What&apos;s included</h3>
          <div className="space-y-3">
            {[
              { icon: '📐', title: 'Custom pattern', desc: 'Generated to your exact measurements' },
              { icon: '🧵', title: 'Material guide', desc: 'Know exactly what to buy and where' },
              { icon: '🎬', title: 'Animated guide', desc: '3D step-by-step sewing instructions' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-label font-semibold text-ink">{item.title}</p>
                  <p className="text-caption text-ink-3">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-bg via-bg to-transparent">
        <Link href={`/garment/${id}/measurements`}>
          <PrimaryButton>Start this project — €{garment.price}</PrimaryButton>
        </Link>
      </div>
    </div>
  )
}
