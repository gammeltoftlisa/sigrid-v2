'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Creator } from '@/lib/types'

interface Props {
  creator: Creator
  variant?: 'horizontal' | 'vertical'
}

export default function CreatorCard({ creator, variant = 'vertical' }: Props) {
  if (variant === 'horizontal') {
    return (
      <Link href={`/creator/${creator.id}`}>
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-center gap-2 w-24"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-surface text-[22px] font-bold shadow-soft"
            style={{ backgroundColor: creator.avatarColor }}
          >
            {creator.name[0]}
          </div>
          <div className="text-center">
            <p className="text-caption font-semibold text-ink leading-tight">{creator.handle}</p>
            <p className="text-caption text-ink-3">{creator.followerCount}</p>
          </div>
          {creator.isCertified && (
            <span className="text-[10px] font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded-full">
              Certified
            </span>
          )}
        </motion.div>
      </Link>
    )
  }

  return (
    <Link href={`/creator/${creator.id}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="bg-surface rounded-3xl p-4 shadow-soft border border-rim-soft flex items-center gap-4"
      >
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
              <span className="text-[10px] font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                ✓ Certified
              </span>
            )}
          </div>
          <p className="text-caption text-ink-3">{creator.followerCount} followers · {creator.patternCount} patterns</p>
          <p className="text-caption text-ink-2 mt-0.5 truncate">{creator.bio}</p>
        </div>
      </motion.div>
    </Link>
  )
}
