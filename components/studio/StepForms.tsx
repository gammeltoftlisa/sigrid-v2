'use client'

import { IconPlus, IconTrash } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { ChipGroup } from '@/components/patterns/chip-group'
import { TOOLS, type Tool } from '@/components/sewing/tools'
import { allSizes } from '@/lib/sizes'
import {
  baseSize,
  gradeFrom,
  newPiece,
  pieceSizeDone,
  sortSizes,
  standardBody,
  type BodySize,
  type PieceSize,
  type StudioPattern,
  type StudioPiece,
} from '@/lib/studio/patterns'
import type { Difficulty, GarmentCategory, StandardSize } from '@/lib/types'
import { NumberField, TextField } from './fields'
import { SizeTable } from './SizeTable'

type Props = { pattern: StudioPattern; onChange: (patch: Partial<StudioPattern>) => void }

const CATEGORIES: GarmentCategory[] = ['Tops', 'Bottoms', 'Dresses', 'Outerwear']
const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']

function Chips<T extends string>({ label, hint, ...props }: { label: string; hint?: string } & React.ComponentProps<typeof ChipGroup<T>>) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <ChipGroup<T> label={label} {...props} />
      {hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

/** Step 1: what it's called and what it costs */
export function BasicsForm({ pattern, onChange }: Props) {
  return (
    <>
      <TextField
        label="Name"
        value={pattern.name === 'Untitled pattern' ? '' : pattern.name}
        placeholder="Linen A-line dress"
        onChange={(name) => onChange({ name: name || 'Untitled pattern' })}
      />
      <div className="sm:w-1/2">
        <NumberField label="Price" unit="€" value={pattern.price} placeholder="12" onChange={(price) => onChange({ price })} hint="What sewers pay for the pattern and guide." />
      </div>
      <Chips label="Category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={[pattern.category]} onValueChange={([category]) => onChange({ category })} />
      <Chips label="Difficulty" options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} value={[pattern.difficulty]} onValueChange={([difficulty]) => onChange({ difficulty })} />
    </>
  )
}

/** Step 2: what sewers read before buying */
export function DescribeForm({ pattern, onChange }: Props) {
  return (
    <>
      <TextField
        long
        label="Description"
        value={pattern.description}
        placeholder="A sleeveless, knee-length dress that pulls over the head. No zip, two patch pockets."
        hint="Two or three calm sentences: the shape, what makes it nice, what you learn."
        onChange={(description) => onChange({ description })}
      />
      <div className="sm:w-1/2">
        <TextField label="Time to sew" value={pattern.estimatedTime} placeholder="4–5 hours" onChange={(estimatedTime) => onChange({ estimatedTime })} />
      </div>
    </>
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
  const setCell = (s: StandardSize, key: keyof BodySize, n: number | null) =>
    onChange({ sizeChart: { ...pattern.sizeChart, [s]: { ...(pattern.sizeChart[s] ?? { bust: null, waist: null, hips: null }), [key]: n } } })

  return (
    <>
      <Chips<StandardSize>
        multiple
        label="Sizes"
        hint="Every size you choose needs its own measurements, here and on the next steps."
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
    </>
  )
}

/** Step 4: what to buy and have at hand, with the fabric amount per size */
export function MaterialsForm({ pattern, onChange }: Props) {
  const fabric = pattern.fabric
  const base = baseSize(pattern.sizes)
  const baseMeters = fabric.metersBySize[base]

  const fill = () => {
    if (!baseMeters) return
    const next = { ...fabric.metersBySize }
    for (const s of pattern.sizes) if (!next[s]) next[s] = gradeFrom(pattern, base, s).meters(baseMeters)
    onChange({ fabric: { ...fabric, metersBySize: next } })
  }

  return (
    <>
      <TextField label="Fabric" value={fabric.name} placeholder="Linen or cotton poplin" onChange={(name) => onChange({ fabric: { ...fabric, name } })} />
      <TextField
        label="Why this fabric (optional)"
        value={fabric.why}
        placeholder="Light and breathable, and it presses crisply."
        onChange={(why) => onChange({ fabric: { ...fabric, why } })}
      />
      <Field>
        <FieldLabel>How much fabric</FieldLabel>
        <FieldDescription>Metres of 140–150 cm wide fabric for each size, with a little extra for shrinking.</FieldDescription>
        {pattern.sizes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Choose the sizes first, in the Sizes step.</p>
        ) : (
          <SizeTable
            label="Fabric per size"
            sizes={pattern.sizes}
            base={base}
            columns={[{ key: 'meters', label: 'Fabric', unit: 'm' }]}
            value={(s) => fabric.metersBySize[s]}
            onChange={(s, _k, n) => onChange({ fabric: { ...fabric, metersBySize: { ...fabric.metersBySize, [s]: n } } })}
            onFill={fill}
            canFill={!!baseMeters}
          />
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="notions">Also needed (optional)</FieldLabel>
        <Textarea id="notions" value={pattern.notions.join('\n')} placeholder={'Matching thread\nBias binding, 2 m'} onChange={(e) => onChange({ notions: e.target.value.split('\n') })} />
        <FieldDescription>One thing per line, with the amount.</FieldDescription>
      </Field>
      <Chips<Tool>
        multiple
        label="Tools"
        options={(Object.keys(TOOLS) as Tool[]).map((t) => ({ value: t, label: TOOLS[t].label }))}
        value={pattern.tools}
        onValueChange={(tools) => onChange({ tools })}
      />
    </>
  )
}

/** Step 5: pattern pieces as simple rectangles, with their width and length in every size */
export function PiecesForm({ pattern, onChange }: Props) {
  const { pieces, sizes } = pattern
  const base = baseSize(sizes)

  const update = (i: number, patch: Partial<StudioPiece>) => onChange({ pieces: pieces.map((p, j) => (j === i ? { ...p, ...patch } : p)) })
  const setCell = (i: number, s: StandardSize, key: keyof PieceSize, n: number | null) => {
    const p = pieces[i]
    update(i, { bySize: { ...p.bySize, [s]: { ...(p.bySize[s] ?? { width: null, length: null }), [key]: n } } })
  }
  const fill = (i: number) => {
    const p = pieces[i]
    const from = p.bySize[base]
    if (!pieceSizeDone(from)) return
    const next = { ...p.bySize }
    for (const s of sizes) {
      if (pieceSizeDone(next[s])) continue
      const g = gradeFrom(pattern, base, s)
      next[s] = { width: next[s]?.width ?? g.width(from!.width!), length: next[s]?.length ?? g.length(from!.length!) }
    }
    update(i, { bySize: next })
  }
  const remove = (i: number) => {
    const id = pieces[i].id
    onChange({ pieces: pieces.filter((_, j) => j !== i), steps: pattern.steps.map((s) => (s.pieceId === id ? { ...s, pieceId: undefined } : s)) })
  }
  const add = () => {
    const piece = newPiece(pieces)
    onChange({ pieces: [...pieces, piece] })
    requestAnimationFrame(() => document.getElementById(`piece-${piece.id}`)?.querySelector('input')?.focus())
  }

  if (sizes.length === 0) return <p className="text-sm text-muted-foreground">Choose the sizes first, in the Sizes step. Each piece needs a width and length for every size.</p>

  return (
    <>
      <div className="sm:w-1/2">
        <NumberField label="Seam allowance" unit="cm" value={pattern.seamAllowance} placeholder="1.5" onChange={(n) => n && onChange({ seamAllowance: n })} hint="Included in every piece." />
      </div>
      {pieces.map((p, i) => (
        <div key={p.id} id={`piece-${p.id}`} className="flex flex-col gap-4 rounded-(--radius) bg-card p-4">
          <div className="flex items-end gap-3">
            <span aria-hidden className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {p.label}
            </span>
            <div className="flex-1">
              <TextField label={`Piece ${p.label}`} value={p.name === 'New piece' ? '' : p.name} placeholder="Front" onChange={(name) => update(i, { name: name || 'New piece' })} />
            </div>
            <div className="w-24">
              <NumberField label="Cut" unit="×" value={p.quantity} placeholder="2" onChange={(n) => update(i, { quantity: n ? Math.round(n) : 1 })} />
            </div>
            <Button variant="ghost" size="icon-lg" aria-label={`Delete piece ${p.label}`} onClick={() => remove(i)}>
              <IconTrash />
            </Button>
          </div>
          <SizeTable
            label={`Piece ${p.label} sizes`}
            sizes={sizes}
            base={base}
            columns={[
              { key: 'width', label: 'Width', unit: 'cm' },
              { key: 'length', label: 'Length', unit: 'cm' },
            ]}
            value={(s, k) => p.bySize[s]?.[k]}
            onChange={(s, k, n) => setCell(i, s, k, n)}
            onFill={() => fill(i)}
            canFill={pieceSizeDone(p.bySize[base])}
          />
        </div>
      ))}
      <Button variant="outline" size="lg" onClick={add}>
        <IconPlus data-icon="inline-start" />
        {pieces.length === 0 ? 'Add the first piece' : 'Add another piece'}
      </Button>
    </>
  )
}
