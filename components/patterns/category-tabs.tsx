'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from 'cn'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/**
 * Single-choice text tabs for filtering a grid (All / Tops / Bottoms …).
 * Scrolls sideways on phones with a fading edge; the brand layer draws the underline.
 */
export function CategoryTabs<T extends string>({
  options,
  value,
  onValueChange,
  label,
  className,
}: {
  options: readonly T[]
  value: T
  onValueChange: (value: T) => void
  label: string
  className?: string
}) {
  const underline = useId()
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(v) => v[0] && onValueChange(v[0] as T)}
      className={cn('scroll-row -mx-4 flex w-auto overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o} value={o} data-tab className="shrink-0">
          {o}
          {o === value && (
            <motion.span
              layoutId={underline}
              aria-hidden
              className="absolute inset-x-0 -bottom-px h-px bg-foreground"
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            />
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
