'use client'

import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { ChipGroup } from '@/components/patterns/chip-group'
import { allSizes } from '@/lib/sizes'
import {
  baseSize,
  gradeFrom,
  sortSizes,
  standardBody,
  type BodySize,
  type StudioPattern,
} from '@/lib/studio/patterns'
import type { StandardSize } from '@/lib/types'
import { SizeTable } from './SizeTable'

type Props = { pattern: StudioPattern; onChange: (patch: Partial<StudioPattern>) => void }


function Chips<T extends string>({ label, hint, ...props }: { label: string; hint?: string } & React.ComponentProps<typeof ChipGroup<T>>) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <ChipGroup<T> label={label} {...props} />
      {hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

/**
 * Step 3: the sizes and the size chart. A newly chosen size starts with Sigrid's
 * standard body measurements, so most makers only adjust a few numbers.
 */
export function SizesForm({ pattern, onChange }: Props) {
  const sizes = pattern.sizes
  const base = baseSize(sizes)

  const setSizes = (next: StandardSize[]) => {
    const sorted = sortSizes(next)
    const chart = { ...pattern.sizeChart }
    for (const s of sorted) if (!chart[s]) chart[s] = standardBody(s)
    onChange({ sizes: sorted, sizeChart: chart })
  }
  const fabric = pattern.fabric
  // Fill from M when it's there, otherwise from the nearest size the maker did fill in
  // (a pattern often gives the fabric for one size only, e.g. S)
  const order = [...sizes].sort((a, b) => Math.abs(allSizes.indexOf(a) - allSizes.indexOf(base)) - Math.abs(allSizes.indexOf(b) - allSizes.indexOf(base)))
  const from = order.find((s) => fabric.metersBySize[s])
  const fromMeters = from ? fabric.metersBySize[from] : undefined
  const fillMeters = () => {
    if (!from || !fromMeters) return
    const next = { ...fabric.metersBySize }
    for (const s of sizes) if (!next[s]) next[s] = gradeFrom(pattern, from, s).meters(fromMeters)
    onChange({ fabric: { ...fabric, metersBySize: next } })
  }
  const setCell = (s: StandardSize, key: keyof BodySize, n: number | null) =>
    onChange({ sizeChart: { ...pattern.sizeChart, [s]: { ...(pattern.sizeChart[s] ?? { bust: null, waist: null, hips: null }), [key]: n } } })

  return (
    <>
      <Chips<StandardSize>
        multiple
        label="Sizes"
        options={allSizes.map((s) => ({ value: s, label: s }))}
        value={sizes}
        onValueChange={setSizes}
      />
      {sizes.length > 0 && (
        <Field>
          <FieldLabel>Size chart</FieldLabel>
          <FieldDescription>
            The body measurements each size is made for. They start as Sigrid’s standard sizes; change any that differ in your pattern.
          </FieldDescription>
          <SizeTable
            label="Size chart"
            sizes={sizes}
            base={base}
            columns={[
              { key: 'bust', label: 'Bust', unit: 'cm' },
              { key: 'waist', label: 'Waist', unit: 'cm' },
              { key: 'hips', label: 'Hips', unit: 'cm' },
            ]}
            value={(s, k) => pattern.sizeChart[s]?.[k]}
            onChange={setCell}
          />
        </Field>
      )}
      {sizes.length > 0 && (
        <Field>
          <FieldLabel>Fabric per size</FieldLabel>
          <FieldDescription>Metres of 140–150 cm wide fabric for each size, with a little extra for shrinking.</FieldDescription>
          <SizeTable
            label="Fabric per size"
            sizes={sizes}
            base={base}
            columns={[{ key: 'meters', label: 'Fabric', unit: 'm' }]}
            value={(s) => fabric.metersBySize[s]}
            onChange={(s, _k, n) => onChange({ fabric: { ...fabric, metersBySize: { ...fabric.metersBySize, [s]: n } } })}
            onFill={fillMeters}
            canFill={!!fromMeters}
            fillFrom={from}
          />
        </Field>
      )}
    </>
  )
}
