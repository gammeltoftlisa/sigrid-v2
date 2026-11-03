'use client'

import { cn } from 'cn'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { euSizes } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'

/**
 * Pick one letter size (EU number alongside). `current` marks the size a project
 * is already in, so it stays recognisable while choosing another.
 */
export function SizePicker({
  sizes,
  value,
  onValueChange,
  current,
  label = 'Size',
}: {
  sizes: StandardSize[]
  value: StandardSize | null
  onValueChange: (size: StandardSize) => void
  current?: StandardSize
  label?: string
}) {
  return (
    <div className="@container w-full">
    <ToggleGroup
      aria-label={label}
      variant="outline"
      spacing={2}
      value={value ? [value] : []}
      onValueChange={(next) => next[0] && onValueChange(next[0] as StandardSize)}
      // Up to five sizes share one row, so none is left alone on a second; more wrap in fours, then sevens
      className={cn('grid w-full', sizes.length <= 5 ? '' : 'grid-cols-4 @xl:grid-cols-7')}
      style={sizes.length <= 5 ? { gridTemplateColumns: `repeat(${sizes.length}, minmax(0, 1fr))` } : undefined}
    >
      {sizes.map((s) => (
        <ToggleGroupItem
          key={s}
          value={s}
          data-shape="tile"
          data-size-picker
          aria-label={`Size ${s}, EU ${euSizes[s]}${current === s ? ', current size' : ''}`}
          className="h-12 w-full flex-col gap-0 rounded-xl"
        >
          <span className="font-medium">{s}</span>
          <span className="text-xs font-normal opacity-70 tabular-nums">
            EU {euSizes[s]}
            {current === s && ' · now'}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
    </div>
  )
}
