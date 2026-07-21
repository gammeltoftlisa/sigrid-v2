'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCreatorById, getPatternsByCreator } from '@/lib/data'
import PatternCard from '@/components/ui/PatternCard'

export default function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const creator = getCreatorById(id)
  const patterns = getPatternsByCreator(id)
  const router = useRouter()
  const [following, setFollowing] = useState(false)

  return (
    <div className="min-h-screen bg-bg pb-8">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <button
          onClick={() => router.back()}
          className="mb-5 w-10 h-10 rounded-full bg-surface shadow-soft flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="var(--sig-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Creator identity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-6"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-surface text-4xl font-bold mb-4 shadow-card"
            style={{ backgroundColor: creator.avatarColor }}
          >
            {creator.name[0]}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-title font-bold text-ink">{creator.handle}</h1>
            {creator.isCertified && (
              <span className="text-[11px] font-semibold bg-primary-soft text-primary px-2.5 py-1 rounded-full flex-shrink-0">
                ✓ Certified
              </span>
            )}
          </div>

          <p className="text-body text-ink-2 mb-4">{creator.bio}</p>

          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-heading font-bold text-ink">{creator.followerCount}</p>
              <p className="text-caption text-ink-3">followers</p>
            </div>
            <div className="w-px h-8 bg-rim" />
            <div className="text-center">
              <p className="text-heading font-bold text-ink">{patterns.length}</p>
              <p className="text-caption text-ink-3">patterns</p>
            </div>
            <div className="w-px h-8 bg-rim" />
            <div className="text-center">
              <p className="text-heading font-bold text-ink">
                {patterns.reduce((sum, p) => sum + p.timesMade, 0).toLocaleString()}
              </p>
              <p className="text-caption text-ink-3">makes</p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFollowing((f) => !f)}
            className={`px-10 py-3.5 rounded-full text-label font-semibold transition-colors duration-200 ${
              following
                ? 'bg-surface-2 text-ink-2 border border-rim'
                : 'bg-primary text-surface shadow-soft'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </motion.button>
        </motion.div>
      </div>

      {/* Patterns */}
      <div className="px-5">
        <h2 className="text-heading font-semibold text-ink mb-4">Patterns</h2>
        {patterns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body text-ink-3">No patterns yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {patterns.map((pattern, i) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <PatternCard pattern={pattern} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
