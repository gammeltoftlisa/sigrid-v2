'use client'

import { motion } from 'framer-motion'

interface Props {
  percent: number
  className?: string
  height?: number
  showLabel?: boolean
  color?: string
}

export default function ProgressBar({
  percent,
  className = '',
  height = 4,
  showLabel = false,
  color = 'bg-primary',
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="flex-1 bg-surface-2 rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      {showLabel && (
        <span className="text-caption text-ink-3 font-medium tabular-nums w-8 text-right">
          {clamped}%
        </span>
      )}
    </div>
  )
}
