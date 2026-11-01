'use client'

import { useState } from 'react'

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Slider } from '@/components/ui/slider'
import type { PriceRange } from '@/lib/fabric/filters'

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Price per metre as a range: drag either end of the slider, or type an amount.
 * The slider applies when it's let go; typed amounts apply on Enter or when leaving the field.
 * Covering the whole range again means "any price".
 */
export function PriceFilter({ bounds, value, onChange, per = 'per metre' }: { bounds: PriceRange; value: PriceRange | null; onChange: (p: PriceRange | null) => void; /** What the price is for, for screen readers */ per?: string }) {
  const lo = clamp(value?.min ?? bounds.min, bounds.min, bounds.max)
  const hi = clamp(value?.max ?? bounds.max, bounds.min, bounds.max)
  const [drag, setDrag] = useState<number[] | null>(null)
  const shown = drag ?? [lo, hi]

  const commit = (min: number, max: number) => {
    const a = clamp(Math.round(Math.min(min, max)), bounds.min, bounds.max)
    const b = clamp(Math.round(Math.max(min, max)), bounds.min, bounds.max)
    onChange(a <= bounds.min && b >= bounds.max ? null : { min: a, max: b })
  }

  return (
    <div className="flex flex-col gap-3">
      <Slider
        min={bounds.min}
        max={bounds.max}
        step={1}
        value={shown}
        thumbLabels={[`Lowest price ${per}`.trim(), `Highest price ${per}`.trim()]}
        onValueChange={(v) => setDrag(v as number[])}
        onValueCommitted={(v) => {
          const [a, b] = v as number[]
          setDrag(null)
          commit(a, b)
        }}
        className="py-2"
      />
      <div key={`${lo}-${hi}`} className="flex items-center gap-2">
        <PriceInput label={`Lowest price ${per}`.trim()} initial={shown[0]} onCommit={(n) => commit(n, hi)} />
        <span aria-hidden className="text-xs text-muted-foreground">to</span>
        <PriceInput label={`Highest price ${per}`.trim()} initial={shown[1]} onCommit={(n) => commit(lo, n)} />
      </div>
    </div>
  )
}

function PriceInput({ label, initial, onCommit }: { label: string; initial: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState(String(initial))
  const apply = () => {
    const n = Number(text.replace(',', '.'))
    if (text.trim() === '' || !Number.isFinite(n)) setText(String(initial))
    else if (n !== initial) onCommit(n)
  }
  return (
    <InputGroup className="flex-1 bg-background">
      <InputGroupAddon>€</InputGroupAddon>
      <InputGroupInput
        aria-label={label}
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={apply}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        className="tabular-nums"
      />
    </InputGroup>
  )
}
