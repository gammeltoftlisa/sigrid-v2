'use client'

import { Fragment, useId, useState } from 'react'
import { IconCheck, IconChevronDown, IconPlus, IconTrash, IconWand, IconX } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { ChipGroup } from '@/components/patterns/chip-group'
import { StatusMessage } from '@/components/patterns/status-message'
import { curveCm, gradePiece, lineAt, pieceSizeDone, type LineSize, type StudioPattern, type StudioPiece } from '@/lib/studio/patterns'
import type { StandardSize } from '@/lib/types'
import { InlineNumber, InlineText } from './Inline'
import { PieceShape } from './PieceShape'
import { PIECE_SHAPES, applyShape, isBlankPiece, type PieceShapeStart } from '@/lib/studio/piece-shapes'
import { CellNumber } from './SizeTable'
import { arrowStep } from '@/lib/studio/arrow-step'

/**
 * The measurements of one pattern piece, in the guide's instruction panel.
 * Pick a size, then fill in each line: how far down from the top it is and how
 * wide the piece is there. The drawing above follows the numbers.
 */
export function PieceEditor({
  pattern,
  piece,
  size,
  onSize,
  onPiece,
  onDelete,
  onOpenSizes,
  onActiveLine,
}: {
  pattern: StudioPattern
  piece: StudioPiece
  /** The size being filled in */
  size: StandardSize
  onSize: (s: StandardSize) => void
  onPiece: (next: StudioPiece) => void
  onDelete: () => void
  onOpenSizes: () => void
  /** The line being worked on (focused or hovered), so the drawing can highlight it */
  onActiveLine?: (lineId: string | null) => void
}) {
  const foldId = useId()
  const blank = isBlankPiece(piece)
  const { sizes } = pattern
  const index = pattern.pieces.findIndex((p) => p.id === piece.id)
  const doneSizes = sizes.filter((s) => pieceSizeDone(piece, s))
  const sizeDone = pieceSizeDone(piece, size)

  const setCell = (lineId: string, key: keyof LineSize, n: number | null) => {
    const row = { ...(piece.bySize[size] ?? {}) }
    row[lineId] = { ...(row[lineId] ?? { down: null, width: null }), [key]: n }
    onPiece({ ...piece, bySize: { ...piece.bySize, [size]: row } })
  }
  const setCurve = (lineId: string, curveBelow: number | null) => onPiece({ ...piece, lines: piece.lines.map((l) => (l.id === lineId ? { ...l, curveBelow } : l)) })
  const renameLine = (lineId: string, label: string) => onPiece({ ...piece, lines: piece.lines.map((l) => (l.id === lineId ? { ...l, label } : l)) })
  const addLine = () => {
    const id = `l${Date.now().toString(36)}`
    const lines = [...piece.lines]
    lines.splice(lines.length - 1, 0, { id, label: '' })
    onPiece({ ...piece, lines })
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[aria-label="Name of measurement line ${lines.length - 1}"]`)?.focus())
  }
  const removeLine = (lineId: string) => {
    const bySize = Object.fromEntries(Object.entries(piece.bySize).map(([s, row]) => [s, Object.fromEntries(Object.entries(row ?? {}).filter(([k]) => k !== lineId))]))
    onPiece({ ...piece, lines: piece.lines.filter((l) => l.id !== lineId), bySize })
  }

  return (
    <section aria-label={`Piece ${piece.label}`} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-sm font-semibold">
          {piece.label}
        </span>
        <InlineText
          required
          label="Piece name"
          value={piece.name === 'New piece' ? '' : piece.name}
          placeholder="Name the piece, e.g. Front"
          onChange={(name) => onPiece({ ...piece, name: name || 'New piece' })}
          className="min-w-40 flex-1 text-lg leading-tight font-semibold"
        />
        <span className="flex items-baseline text-sm text-muted-foreground">
          Cut
          <InlineNumber label="How many to cut" unit="×" value={piece.quantity} placeholder="1" onChange={(n) => onPiece({ ...piece, quantity: n ? Math.round(n) : 1 })} className="text-foreground" />
        </span>
        <label htmlFor={foldId} className="flex items-center gap-2 text-sm">
          <Switch id={foldId} checked={piece.onFold} onCheckedChange={(onFold) => onPiece({ ...piece, onFold })} />
          On the fold
        </label>
        <Button variant="ghost" size="icon-sm" aria-label={`Delete piece ${piece.label}${pattern.pieces.length > 1 ? `, ${index + 1} of ${pattern.pieces.length}` : ''}`} onClick={onDelete}>
          <IconTrash />
        </Button>
      </div>

      {sizes.length === 0 ? (
        <StatusMessage
          status="info"
          title="Choose the sizes first"
          action={
            <Button variant="outline" size="sm" onClick={onOpenSizes}>
              Open sizes
            </Button>
          }
        >
          Every size gets its own measurements.
        </StatusMessage>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ChipGroup<StandardSize>
              label="Size you are filling in"
              options={sizes.map((s) => ({
                value: s,
                label: (
                  <span className="inline-flex items-center gap-1">
                    {s}
                    {pieceSizeDone(piece, s) && <IconCheck className="size-3" aria-label="filled in" />}
                  </span>
                ),
              }))}
              value={[size]}
              onValueChange={([s]) => onSize(s)}
            />
            {sizes.length > 1 && doneSizes.length < sizes.length ? (
              <Button variant="outline" size="xs" disabled={!sizeDone} onClick={() => onPiece(gradePiece(pattern, piece, size))}>
                <IconWand data-icon="inline-start" />
                {sizeDone ? `Fill ${sizes.filter((s) => s !== size && !pieceSizeDone(piece, s)).join(', ')} from ${size}` : `Finish ${size}, then fill the rest`}
              </Button>
            ) : (
              sizes.length > 1 && <p className="text-xs text-muted-foreground">Every size filled in</p>
            )}
          </div>

          {/* One plain row per line across the piece: where it is, and how wide the piece is there */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="text-sm text-muted-foreground">{blank ? 'Type the numbers of your piece.' : 'Change the numbers to fit your pattern.'}</p>
              <ShapeMenu blank={blank} onPick={(shape) => onPiece(applyShape(piece, shape, sizes))} piece={piece} />
            </div>
            <ol aria-label={`Measurements of ${piece.name}, size ${size}`} className="flex flex-col gap-2">
              {piece.lines.map((line, i) => {
                const v = lineAt(piece, size, line.id)
                const first = i === 0
                const last = i === piece.lines.length - 1
                const name = line.label || (first ? 'Top edge' : last ? 'Hem' : `Line ${i + 1}`)
                return (
                  <Fragment key={line.id}>
                  <li
                    data-slot="inset"
                    onFocus={() => onActiveLine?.(line.id)}
                    onMouseEnter={() => onActiveLine?.(line.id)}
                    onMouseLeave={() => onActiveLine?.(null)}
                    onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && onActiveLine?.(null)}
                    className="piece-line flex flex-wrap items-center gap-x-4 gap-y-2 rounded-(--control-radius) px-3 py-2"
                  >
                    <InlineText
                      label={`Name of measurement line ${i + 1}`}
                      value={line.label}
                      placeholder={first ? 'Top edge' : last ? 'Hem' : 'Name it, e.g. Waist'}
                      onChange={(label) => renameLine(line.id, label)}
                      className="field-sizing-content w-auto min-w-24 text-sm font-medium"
                    />
                    <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      {!first && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-20"><CellNumber label={`${name}: cm down from the top, size ${size}`} value={v.down} onChange={(n) => setCell(line.id, 'down', n)} /></span>
                          cm from top
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <span className="w-20"><CellNumber label={`${name}: width in cm, size ${size}`} value={v.width} onChange={(n) => setCell(line.id, 'width', n)} /></span>
                        cm wide
                      </span>
                      {!first && !last ? (
                        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${name}`} onClick={() => removeLine(line.id)}>
                          <IconX />
                        </Button>
                      ) : (
                        <span aria-hidden className="size-7" />
                      )}
                    </div>
                    {first && (
                      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <QuietPick
                          label="Shape of the top edge"
                          value={piece.neckline ?? 'straight'}
                          options={[
                            { value: 'straight', glyph: 'M2 6 L14 6', text: 'Straight top' },
                            { value: 'scoop', glyph: 'M2 4 Q8 12 14 4', text: 'Scooped neckline' },
                          ]}
                          onChange={(neckline) => onPiece({ ...piece, neckline, necklineDepth: piece.necklineDepth ?? (neckline === 'scoop' ? 8 : null) })}
                        />
                        {piece.neckline === 'scoop' && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-20"><CellNumber label="How deep the neckline is, in cm" value={piece.necklineDepth} onChange={(necklineDepth) => onPiece({ ...piece, necklineDepth })} /></span>
                            cm deep
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                  {!last && (
                    <li className="flex items-center gap-2 pl-5 text-xs text-muted-foreground">
                      <CurveField
                        label={`Curve of the side below ${name}`}
                        value={curveCm(line.curveBelow)}
                        onChange={(n) => setCurve(line.id, n)}
                      />
                    </li>
                  )}
                  </Fragment>
                )
              })}
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={addLine}>
              <IconPlus data-icon="inline-start" />
              Add a line
            </Button>
            <span className="text-xs text-muted-foreground">where the width or shape changes, like at the waist</span>
          </div>
        </>
      )}
    </section>
  )
}

/** A small "Start from a shape" button; the shapes only show in its menu */
function ShapeMenu({ blank, piece, onPick }: { blank: boolean; piece: StudioPiece; onPick: (shape: PieceShapeStart) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="xs" className="shrink-0 text-muted-foreground" />}>
        {blank ? 'Start from a shape' : 'Change shape'}
        <IconChevronDown data-icon="inline-end" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 gap-1 p-1.5">
        <p className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground">{blank ? 'Fills in every size with standard numbers.' : 'Replaces the numbers in every size.'}</p>
        {PIECE_SHAPES.map((shape) => (
          <button
            key={shape.id}
            type="button"
            onClick={() => {
              onPick(shape)
              setOpen(false)
            }}
            className="glass-inset-hover flex items-center gap-3 rounded-(--control-radius) px-2 py-1.5 text-left text-sm"
          >
            <span aria-hidden className="block h-7 w-6 shrink-0">
              <PieceShape piece={applyShape(piece, shape, ['M'])} sizes={['M']} active="M" bare />
            </span>
            {shape.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

/**
 * The curve of a side, in cm: quiet "+ Curve" while straight; then a number field where plus bows
 * out and minus bows in. Clearing it (or the ×) makes the side straight again.
 */
function CurveField({ label, value, onChange }: { label: string; value: number; onChange: (n: number | null) => void }) {
  const [open, setOpen] = useState(value !== 0)
  const [text, setText] = useState(value ? String(value) : '')
  if (!open) {
    return (
      <button type="button" aria-label={`${label}: straight. Add a curve`} onClick={() => setOpen(true)} className="glass-inset-hover -mx-1 inline-flex items-center gap-1.5 rounded-full px-2 py-1">
        <Glyph d="M8 2 L8 16" />
        Straight side
        <span className="text-foreground">· Add a curve</span>
      </button>
    )
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <Glyph d={value < 0 ? 'M10 2 Q2 9 10 16' : value > 0 ? 'M5 2 Q13 9 5 16' : 'M8 2 L8 16'} />
      <span className="font-medium text-foreground">Curve</span>
      <input
        aria-label={`${label}, in cm: plus curves out, minus curves in`}
        inputMode="decimal"
        autoFocus={value === 0}
        value={text}
        placeholder="0"
        onChange={(e) => {
          setText(e.target.value)
          const n = parseFloat(e.target.value.replace(',', '.').replace('−', '-'))
          onChange(Number.isFinite(n) && n !== 0 ? n : null)
        }}
        onKeyDown={(e) => {
          const n = arrowStep(e, text)
          if (n === null) return
          setText(String(n))
          onChange(n !== 0 ? n : null)
        }}
        data-slot="input"
        className="h-8 w-16 rounded-(--control-radius) px-2 text-sm tabular-nums"
      />
      cm
      <span className="text-muted-foreground" title="A plus number curves the side out, a minus number curves it in">+ out · − in</span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Make the side straight"
        onClick={() => {
          setText('')
          onChange(null)
          setOpen(false)
        }}
      >
        <IconX />
      </Button>
    </span>
  )
}

/**
 * A small, quiet choice: shows the current option as a tiny drawing and a few words, and opens
 * the others only when asked. Straight is the default and stays out of the way; a curve, once
 * chosen, reads in ink so it's easy to spot.
 */
function QuietPick<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; glyph: string; text: string }[]
  onChange: (v: T) => void
}) {
  const current = options.find((o) => o.value === value) ?? options[0]
  const isDefault = current === options[0]
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`${label}: ${current.text}. Change`}
        className={cn(
          'glass-inset-hover -mx-1 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs',
          isDefault ? 'text-muted-foreground' : 'font-medium text-foreground',
        )}
      >
        <Glyph d={current.glyph} />
        {current.text}
        <IconChevronDown className="size-3 opacity-60" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-1 p-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={cn('glass-inset-hover flex items-center gap-2 rounded-(--control-radius) px-3 py-2 text-left text-sm', o.value === value && 'step-row-active font-medium')}
          >
            <Glyph d={o.glyph} />
            {o.text}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function Glyph({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 18" className="size-4 shrink-0">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  )
}
