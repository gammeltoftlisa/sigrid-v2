'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Garment } from '@/lib/types'
import DifficultyBadge from './DifficultyBadge'
import GarmentIllustration from './GarmentIllustration'

interface Props {
  garment: Garment
  href?: string
}

export default function GarmentCard({ garment, href }: Props) {
  const content = (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="bg-surface rounded-3xl overflow-hidden shadow-soft border border-rim-soft flex flex-col"
    >
      <div className="bg-surface-2 h-44 flex items-center justify-center p-6">
        <GarmentIllustration name={garment.name} className="w-full h-full" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-label font-semibold text-ink leading-snug">{garment.name}</h3>
          <DifficultyBadge difficulty={garment.difficulty} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-caption text-ink-3">{garment.estimatedTime}</span>
          <span className="text-label font-semibold text-primary">€{garment.price}</span>
        </div>
      </div>
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
