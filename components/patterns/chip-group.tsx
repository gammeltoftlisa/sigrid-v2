'use client'

import { cn } from 'cn'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/**
 * A row of small choice chips: tiles that turn ink when chosen.
 * Single choice by default; `multiple` lets several be on at once.
 */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onValueChange,
  multiple,
  className,
}: {
  /** Accessible name for the group */
  label: string
  options: readonly { value: T; label: React.ReactNode }[]
  value: T[]
  onValueChange: (value: T[]) => void
  multiple?: boolean
  className?: string
}) {
  return (
    <ToggleGroup
      aria-label={label}
      multiple={multiple}
      spacing={2}
      value={value}
      onValueChange={(next) => (multiple || next.length > 0) && onValueChange(next as T[])}
      className={cn('flex flex-wrap', className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          data-shape="tile"
          className="data-pressed:bg-primary data-pressed:text-primary-foreground"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
