'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Pattern } from '@/lib/types'
import { creators } from '@/lib/data'
import DifficultyBadge from './DifficultyBadge'
import FitBadge from './FitBadge'
import GarmentIllustration from './GarmentIllustration'

interface Props {
  pattern: Pattern
}

export default function PatternCard({ pattern }: Props) {
  const creator = creators.find((c) => c.id === pattern.creatorId)

  return (
    <Link href={`/garment/${pattern.id}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="bg-surface rounded-3xl overflow-hidden shadow-soft border border-rim-soft flex flex-col hover:shadow-card hover:-translate-y-0.5 transition duration-200 ease-out"
      >
        <div className="bg-surface-2 h-40 flex items-center justify-center p-6 relative">
          <GarmentIllustration name={pattern.name} className="w-full h-full" />
          <div className="absolute top-3 right-3">
            <DifficultyBadge difficulty={pattern.difficulty} />
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2.5">
          <h3 className="text-label font-semibold text-ink">{pattern.name}</h3>
          {creator && (
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-surface font-bold"
                style={{ backgroundColor: creator.avatarColor }}
              >
                {creator.name[0]}
              </div>
              <span className="text-caption text-ink-2">{creator.handle}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FitBadge fit={pattern.fit} />
              <span className="text-caption text-ink-3">{pattern.timesMade.toLocaleString('en-US')} made</span>
            </div>
            <span className="text-label font-semibold text-primary">€{pattern.price}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
