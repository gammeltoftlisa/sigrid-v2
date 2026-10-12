'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from 'cn'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/**
 * Single-choice filter as an Apple-style glass segmented control (All / Tops / Bottoms …).
 * A soft white thumb slides to the chosen segment. Scrolls sideways on phones.
 */
export function CategoryTabs<T extends string>({
  options,
  value,
  onValueChange,
  label,
  counts,
  className,
}: {
  options: readonly T[]
  value: T
  onValueChange: (value: T) => void
  label: string
  /** Optional number after each tab, e.g. how many results it holds */
  counts?: Partial<Record<T, number>>
  className?: string
}) {
  const underline = useId()
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(v) => v[0] && onValueChange(v[0] as T)}
      className={cn('glass-control scroll-row flex w-fit max-w-full gap-0 overflow-x-auto rounded-full p-1', className)}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o} value={o} data-tab data-segment className="relative shrink-0">
          <span className="relative z-10">
            {o}
            {counts?.[o] !== undefined && <span className="ml-1.5 text-muted-foreground tabular-nums">{counts[o]}</span>}
          </span>
          {o === value && (
            <motion.span
              layoutId={underline}
              aria-hidden
              className="segment-thumb absolute inset-0 rounded-full"
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            />
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
