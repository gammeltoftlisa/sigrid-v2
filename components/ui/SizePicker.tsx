'use client'

import { motion } from 'framer-motion'
import { euSizes } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'

interface Props {
  sizes: StandardSize[]
  selected: StandardSize | null
  onSelect: (size: StandardSize) => void
}

export default function SizePicker({ sizes, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {sizes.map((s) => (
        <motion.button
          key={s}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(s)}
          aria-pressed={selected === s}
          aria-label={`Size ${s}, EU ${euSizes[s]}`}
          className={`py-3 rounded-2xl border text-label font-semibold whitespace-nowrap transition-colors ${
            selected === s
              ? 'bg-primary border-primary text-surface'
              : 'bg-surface-2 border-rim text-ink-2 hover:border-primary/40'
          }`}
        >
          {s}
          <span className={`font-medium ${selected === s ? 'text-surface/80' : 'text-ink-3'}`}> / {euSizes[s]}</span>
        </motion.button>
      ))}
    </div>
  )
}
