'use client'

import { useId } from 'react'
import { IconCheck, IconPlus, IconTrash, IconWand, IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChipGroup } from '@/components/patterns/chip-group'
import { StatusMessage } from '@/components/patterns/status-message'
import { gradePiece, lineAt, pieceSizeDone, type LineSize, type StudioPattern, type StudioPiece } from '@/lib/studio/patterns'
import type { StandardSize } from '@/lib/types'
import { InlineNumber, InlineText } from './Inline'
import { CellNumber } from './SizeTable'

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
}: {
  pattern: StudioPattern
  piece: StudioPiece
  /** The size being filled in */
  size: StandardSize
  onSize: (s: StandardSize) => void
  onPiece: (next: StudioPiece) => void
  onDelete: () => void
  onOpenSizes: () => void
}) {
  const foldId = useId()
  const { sizes } = pattern
  const index = pattern.pieces.findIndex((p) => p.id === piece.id)
  const doneSizes = sizes.filter((s) => pieceSizeDone(piece, s))
  const sizeDone = pieceSizeDone(piece, size)

  const setCell = (lineId: string, key: keyof LineSize, n: number | null) => {
    const row = { ...(piece.bySize[size] ?? {}) }
    row[lineId] = { ...(row[lineId] ?? { down: null, width: null }), [key]: n }
    onPiece({ ...piece, bySize: { ...piece.bySize, [size]: row } })
  }
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Pattern pieces</span> · Piece {index + 1} of {pattern.pieces.length}
        </p>
        <Button variant="ghost" size="icon-sm" aria-label={`Delete piece ${piece.label}`} onClick={onDelete}>
          <IconTrash />
        </Button>
      </div>

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
            <p className="text-xs text-muted-foreground tabular-nums">
              {doneSizes.length} of {sizes.length} sizes filled in
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table aria-label={`Measurements of ${piece.name}, size ${size}`}>
              <TableHeader>
                <TableRow>
                  <TableHead>Line</TableHead>
                  <TableHead>
                    From top <span className="font-normal text-muted-foreground">(cm)</span>
                  </TableHead>
                  <TableHead>
                    Width <span className="font-normal text-muted-foreground">(cm)</span>
                  </TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Remove</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {piece.lines.map((line, i) => {
                  const v = lineAt(piece, size, line.id)
                  const first = i === 0
                  const last = i === piece.lines.length - 1
                  return (
                    <TableRow key={line.id}>
                      <TableCell className="min-w-36">
                        <InlineText
                          label={`Name of measurement line ${i + 1}`}
                          value={line.label}
                          placeholder={first ? 'Top' : last ? 'Hem' : 'e.g. Waist'}
                          onChange={(label) => renameLine(line.id, label)}
                          className="text-sm font-medium"
                        />
                      </TableCell>
                      <TableCell>
                        {first ? (
                          <span className="px-3 text-sm text-muted-foreground tabular-nums">0</span>
                        ) : (
                          <CellNumber label={`${line.label || `Line ${i + 1}`} from top, size ${size} (cm)`} value={v.down} onChange={(n) => setCell(line.id, 'down', n)} />
                        )}
                      </TableCell>
                      <TableCell>
                        <CellNumber label={`${line.label || `Line ${i + 1}`} width, size ${size} (cm)`} value={v.width} onChange={(n) => setCell(line.id, 'width', n)} />
                      </TableCell>
                      <TableCell>
                        {!first && !last && (
                          <Button variant="ghost" size="icon-sm" aria-label={`Remove line ${line.label || i + 1}`} onClick={() => removeLine(line.id)}>
                            <IconX />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={addLine}>
              <IconPlus data-icon="inline-start" />
              Add a measurement line
            </Button>
            {sizes.length > 1 && doneSizes.length < sizes.length && (
              <Button variant="outline" size="sm" disabled={!sizeDone} onClick={() => onPiece(gradePiece(pattern, piece, size))}>
                <IconWand data-icon="inline-start" />
                {sizeDone ? `Fill the other sizes from ${size}` : `Finish ${size} to fill the others`}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
