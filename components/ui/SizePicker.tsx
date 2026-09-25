'use client'

import { motion } from 'framer-motion'
import { euSizes } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'
import { TAP } from './interaction'

interface Props {
  sizes: StandardSize[]
  selected: StandardSize | null
  onSelect: (size: StandardSize) => void
  /** The size a project is currently in; outlined so it stays recognisable while picking another */
  current?: StandardSize
}

export default function SizePicker({ sizes, selected, onSelect, current }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {sizes.map((s) => (
        <motion.button
          key={s}
          type="button"
          whileTap={TAP}
          onClick={() => onSelect(s)}
          aria-pressed={selected === s}
          aria-label={`Size ${s}, EU ${euSizes[s]}${current === s ? ' (current)' : ''}`}
          className={`py-3 rounded-2xl border text-label font-semibold whitespace-nowrap transition-colors duration-150 ${
            selected === s
              ? 'bg-primary border-primary text-surface'
              : current === s
                ? 'bg-surface-2 border-primary text-ink hover:bg-rim'
                : 'bg-surface-2 border-rim text-ink-2 hover:bg-rim hover:text-ink'
          }`}
        >
          {s}
          <span className={`font-medium ${selected === s ? 'text-surface/80' : 'text-ink-3'}`}> / {euSizes[s]}</span>
        </motion.button>
      ))}
    </div>
  )
}
