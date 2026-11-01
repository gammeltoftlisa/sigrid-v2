'use client'

import { IconChevronDown } from '@tabler/icons-react'
import { cn } from 'cn'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, selectTriggerClass } from '@/components/ui/select'
import { PriceFilter } from '@/components/patterns/fabric-filters'
import { MULTICOLOUR } from '@/lib/shop/taxonomy'

export interface DropdownOption {
  value: string
  label?: string
  count?: number
  /** For colours: the swatch */
  hex?: string
}

const LIGHT_COLOURS = new Set(['White', 'Cream'])

/** A colour as a plain dot */
export function Swatch({ option }: { option: Pick<DropdownOption, 'value' | 'hex'> }) {
  return <span aria-hidden className={cn('swatch-dot', option.value === MULTICOLOUR && 'swatch-multi', LIGHT_COLOURS.has(option.value) && 'swatch-light')} style={option.hex ? { backgroundColor: option.hex } : undefined} />
}

const summary = (values: string[], labelOf: (v: string) => string) => (values.length <= 2 ? values.map(labelOf).join(', ') : `${values.length} chosen`)

/** One filter as a dropdown: choose as many as you like, and it says what's chosen. */
export function FilterDropdown({ label, options, value, onChange }: { label: string; options: DropdownOption[]; value: string[]; onChange: (value: string[]) => void }) {
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v
  return (
    <Select multiple items={options.map((o) => ({ value: o.value, label: o.label ?? o.value }))} value={value} onValueChange={(v) => onChange(v as string[])}>
      <SelectTrigger aria-label={label} className="w-full bg-background">
        <SelectValue>{(v: string[]) => (v.length === 0 ? <span className="text-muted-foreground">{label}</span> : summary(v, labelOf))}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.count === 0 && !value.includes(o.value)}>
            {(o.hex || o.value === MULTICOLOUR) && <Swatch option={o} />}
            {o.label ?? o.value}
            {o.count !== undefined && <span className="ml-auto text-xs text-muted-foreground tabular-nums">{o.count}</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Price as a dropdown, to match */
export function PriceDropdown({
  label,
  bounds,
  value,
  onChange,
  per,
}: {
  label: string
  bounds: { min: number; max: number }
  value: { min: number; max: number } | null
  onChange: (price: { min: number; max: number } | null) => void
  per?: string
}) {
  return (
    <Popover>
      {/* Dressed exactly as a select, so it reads as one more dropdown */}
      <PopoverTrigger aria-label={label} data-slot="select-trigger" data-size="default" className={selectTriggerClass}>
        <span data-slot="select-value" className="min-w-0 flex-1 truncate text-left">{value ? `€${value.min}–€${value.max}` : <span className="text-muted-foreground">{label}</span>}</span>
        <IconChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-(--anchor-width) gap-3 p-3.5" aria-label={label}>
        <p className="eyebrow text-muted-foreground">{label}</p>
        <PriceFilter bounds={bounds} value={value} onChange={onChange} per={per} />
      </PopoverContent>
    </Popover>
  )
}
