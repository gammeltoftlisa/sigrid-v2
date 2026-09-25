'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import GarmentCard from '@/components/ui/GarmentCard'
import PatternCard from '@/components/ui/PatternCard'
import ProgressBar from '@/components/ui/ProgressBar'
import PrimaryButton from '@/components/ui/PrimaryButton'
import { garments, creatorPatterns, activeProject } from '@/lib/data'
import { useFlow } from '@/lib/flow-context'

const SHOW_ACTIVE = true

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const { openFlow } = useFlow()
  const [activeCategory, setActiveCategory] = useState('All')
  const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear']

  const filteredGarments =
    activeCategory === 'All'
      ? garments
      : garments.filter((g) => g.category === activeCategory)

  return (
    <div className="min-h-full bg-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-display font-bold text-ink">
            {greeting()}, Emma 👋
          </h1>
          <p className="text-body text-ink-2 mt-1">
            {SHOW_ACTIVE ? 'Welcome back.' : 'Ready to make something?'}
          </p>
        </motion.div>
      </div>

      {/* Active project card */}
      {SHOW_ACTIVE && (
        <div className="px-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-surface rounded-3xl p-5 shadow-card"
          >
            <p className="text-caption font-semibold text-ink-3 uppercase tracking-wide mb-3">
              Continue where you left off
            </p>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-heading font-semibold text-ink">{activeProject.garmentName}</h2>
                <p className="text-caption text-ink-3 mt-0.5">Step 5 of 12</p>
              </div>
              <div className="w-14 h-14 bg-primary-soft rounded-2xl flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 120 120" fill="none">
                  <path d="M28 30 L20 52 L37 54 L37 96 L83 96 L83 54 L100 52 L92 30 L75 38 Q60 44 45 38 Z"
                    fill="var(--sig-primary)" fillOpacity="0.3" stroke="var(--sig-primary)" strokeWidth="3" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <ProgressBar percent={activeProject.progressPercent} showLabel />
            <div className="mt-4">
              <PrimaryButton onClick={() => openFlow(activeProject.garmentId, 'guide')}>Continue sewing</PrimaryButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty state CTA (new user) */}
      {!SHOW_ACTIVE && (
        <div className="px-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-primary-soft rounded-3xl p-6 shadow-soft"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-heading font-semibold text-ink mb-1">Start your first project</h2>
                <p className="text-body text-ink-2">Pick a garment and we&apos;ll guide you through every step.</p>
              </div>
              <div className="w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="90" fill="var(--sig-primary)" fillOpacity="0.2" />
                  <path d="M60 80 L80 65 L120 65 L140 80 L140 150 L60 150 Z"
                    fill="var(--sig-primary)" fillOpacity="0.4" stroke="var(--sig-primary)" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <Link href="/explore">
              <PrimaryButton>Browse patterns</PrimaryButton>
            </Link>
          </motion.div>
        </div>
      )}

      {/* Garment library */}
      <div className="px-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading font-semibold text-ink">
            {SHOW_ACTIVE ? 'Start something new' : 'Choose a garment'}
          </h2>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-label font-medium transition-colors duration-200 ${
                activeCategory === cat
                  ? 'bg-primary text-surface'
                  : 'bg-surface-2 text-ink-2'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredGarments.map((garment, i) => (
            <motion.div
              key={garment.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <GarmentCard garment={garment} href={`/garment/${garment.id}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Creator patterns (returning user) */}
      {SHOW_ACTIVE && (
        <div className="mb-8">
          <div className="px-5 flex items-center justify-between mb-4">
            <h2 className="text-heading font-semibold text-ink">New from creators</h2>
            <Link href="/explore" className="text-label font-semibold text-primary">See all</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto px-5 pb-2">
            {creatorPatterns.slice(0, 4).map((pattern) => (
              <div key={pattern.id} className="w-48 flex-shrink-0">
                <PatternCard pattern={pattern} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
