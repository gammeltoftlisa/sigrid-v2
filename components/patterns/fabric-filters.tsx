'use client'

import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { conditionLabels, facets, priceLabel, type FabricFilters, type FacetOption, type PriceRange } from '@/lib/fabric/filters'
import type { FabricCondition, FabricListing } from '@/lib/fabric/types'

/** One filter: a small label, then its options */
function Section({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2 pt-3">
      {/* Lines up with the panel's own label */}
      <legend className="eyebrow float-left w-full px-1 text-muted-foreground">{legend}</legend>
      {children}
    </fieldset>
  )
}

/**
 * Square chips that switch on and off, with a quiet count. Options with no results
 * are left out. Taller on touch screens so they stay easy to hit.
 */
function Chips({
  label,
  options,
  value,
  onChange,
  multiple = true,
  showCount = true,
}: {
  label: string
  options: FacetOption[]
  value: string[]
  onChange: (value: string[]) => void
  multiple?: boolean
  showCount?: boolean
}) {
  return (
    <ToggleGroup
      aria-label={label}
      multiple={multiple}
      variant="outline"
      value={value}
      onValueChange={(v) => onChange(v as string[])}
      className="w-full flex-wrap"
    >
      {options
        .filter((o) => o.count > 0 || value.includes(o.value))
        .map((o) => {
          const on = value.includes(o.value)
          return (
            <ToggleGroupItem
              key={o.value}
              value={o.value}
              data-shape="tile"
              className={cn(
                'gap-1 font-normal data-pressed:bg-foreground data-pressed:text-background data-pressed:hover:bg-foreground',
              )}
            >
              {o.label}
              {showCount && <span className={cn('text-xs tabular-nums', on ? 'opacity-70' : 'text-muted-foreground')}>{o.count}</span>}
            </ToggleGroupItem>
          )
        })}
    </ToggleGroup>
  )
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Price per metre as a range: drag either end of the slider, or type an amount.
 * The slider applies when it's let go; typed amounts apply on Enter or when leaving the field.
 * Covering the whole range again means "any price".
 */
function PriceFilter({ bounds, value, onChange }: { bounds: PriceRange; value: PriceRange | null; onChange: (p: PriceRange | null) => void }) {
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
        thumbLabels={['Lowest price per metre', 'Highest price per metre']}
        onValueChange={(v) => setDrag(v as number[])}
        onValueCommitted={(v) => {
          const [a, b] = v as number[]
          setDrag(null)
          commit(a, b)
        }}
        className="py-2"
      />
      <div key={`${lo}-${hi}`} className="flex items-center gap-2">
        <PriceInput label="Lowest price per metre" initial={shown[0]} onCommit={(n) => commit(n, hi)} />
        <span aria-hidden className="text-xs text-muted-foreground">to</span>
        <PriceInput label="Highest price per metre" initial={shown[1]} onCommit={(n) => commit(lo, n)} />
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

const listLabel = (values: string[], labelOf: (v: string) => string) =>
  values.length === 0 ? undefined : values.length <= 2 ? values.map(labelOf).join(', ') : `${values.length} chosen`

/**
 * Filters for a list of fabrics, compact like a store's side filters: condition, main fibre and
 * a price range, and shops in a dropdown. Every option shows how many results it gives with the others.
 * Notions (thread, zips) only get the shop filter.
 */
export function FabricFilterGroups({
  listings,
  filters,
  onChange,
  notions,
  flush,
}: {
  listings: FabricListing[]
  filters: FabricFilters
  onChange: (f: FabricFilters) => void
  notions?: boolean
  /** Drop the hairline above the first filter, when nothing sits above it */
  flush?: boolean
}) {
  const f = facets(listings, filters)
  const shopName = (v: string) => f.shops.find((s) => s.value === v)?.label ?? v

  return (
    <div className={cn('flex flex-col gap-3', flush && '[&>:first-child]:pt-0')}>
      {!notions && (
        <Section legend="Condition">
          <Chips
            label="Condition"
            options={f.conditions}
            value={filters.conditions}
            onChange={(v) => onChange({ ...filters, conditions: v as FabricCondition[] })}
          />
        </Section>
      )}

      {!notions && f.fibres.length > 0 && (
        <Section legend="Main fibre">
          <Chips label="Main fibre" options={f.fibres} value={filters.fibres} onChange={(v) => onChange({ ...filters, fibres: v })} />
        </Section>
      )}

      {!notions && f.price && (
        <Section legend="Price per metre">
          <PriceFilter bounds={f.price} value={filters.price} onChange={(price) => onChange({ ...filters, price })} />
        </Section>
      )}

      {f.shops.length > 0 && (
        <Section legend="Shop">
          <Select
            multiple
            items={f.shops.map((o) => ({ value: o.value, label: o.label }))}
            value={filters.shops}
            onValueChange={(v) => onChange({ ...filters, shops: v as string[] })}
          >
            <SelectTrigger aria-label="Shop" className="w-full bg-background">
              <SelectValue>
                {(v: string[]) =>
                  v.length === 0 ? (
                    <span className="text-muted-foreground">{f.shops.length === 1 ? '1 shop' : `All ${f.shops.length} shops`}</span>
                  ) : (
                    listLabel(v, shopName)
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {f.shops
                .filter((o) => o.count > 0 || filters.shops.includes(o.value))
                .map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                    <span className="text-xs text-muted-foreground tabular-nums">{o.count}</span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Section>
      )}
    </div>
  )
}

/** The filters in use as small removable chips, with a way to clear them all. */
export function ActiveFilters({
  filters,
  onChange,
  shopNames,
}: {
  filters: FabricFilters
  onChange: (f: FabricFilters) => void
  shopNames: Map<string, string>
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...filters.conditions.map((c: FabricCondition) => ({
      key: `c-${c}`,
      label: conditionLabels[c],
      remove: () =>
        onChange({
          ...filters,
          conditions: filters.conditions.filter((v) => v !== c),
        }),
    })),
    ...filters.fibres.map((fibre) => ({
      key: `f-${fibre}`,
      label: fibre,
      remove: () =>
        onChange({
          ...filters,
          fibres: filters.fibres.filter((v) => v !== fibre),
        }),
    })),
    ...(filters.price
      ? [
          {
            key: 'price',
            label: priceLabel(filters.price),
            remove: () => onChange({ ...filters, price: null }),
          },
        ]
      : []),
    ...filters.shops.map((s) => ({
      key: `s-${s}`,
      label: shopNames.get(s) ?? s,
      remove: () => onChange({ ...filters, shops: filters.shops.filter((v) => v !== s) }),
    })),
  ]
  if (chips.length === 0) return null

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Filters in use">
      {chips.map((c) => (
        <li key={c.key}>
          <Button variant="outline" size="sm" onClick={c.remove} aria-label={`Remove filter: ${c.label}`}>
            {c.label}
            <IconX data-icon="inline-end" />
          </Button>
        </li>
      ))}
      <li>
        <Button variant="ghost" size="sm" onClick={() => onChange({ conditions: [], shops: [], fibres: [], price: null })}>
          Clear all
        </Button>
      </li>
    </ul>
  )
}
