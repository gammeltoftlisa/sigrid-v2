'use client'

import { IconRulerMeasure } from '@tabler/icons-react'

import { lineAt, outline, type StudioPiece } from '@/lib/studio/patterns'
import type { StandardSize } from '@/lib/types'

const W = 360
const H = 420
const PAD = 44

/**
 * The piece drawn from the maker's numbers. Every finished size is drawn,
 * nested like a printed graded pattern; the size being edited is filled and
 * carries its measurements. A piece cut on the fold shows its half, with the
 * fold on the left.
 */
export function PieceShape({ piece, sizes, active }: { piece: StudioPiece; sizes: StandardSize[]; active: StandardSize }) {
  const shapes = sizes.map((s) => ({ size: s, o: outline(piece, s) })).filter((x) => x.o)
  const complete = !!outline(piece, active)
  // What's filled in so far in this size, so the drawing grows with each number you type
  const current = (() => {
    const out: { label: string; down: number; width: number }[] = []
    piece.lines.forEach((l, i) => {
      const v = lineAt(piece, active, l.id)
      const last = out[out.length - 1]
      if (!v.width || v.down === null || (last && v.down <= last.down)) return
      out.push({ label: l.label || (i === 0 ? 'Top edge' : i === piece.lines.length - 1 ? 'Hem' : `Line ${i + 1}`), down: v.down, width: v.width })
    })
    return out
  })()

  if (shapes.length === 0 && current.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <IconRulerMeasure className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">{piece.name === 'New piece' ? 'Your piece' : piece.name} appears here</p>
        <p className="max-w-xs text-sm text-muted-foreground">Type the width of the top edge and it’s drawn here. Every number you add shows straight away.</p>
      </div>
    )
  }

  const maxW = Math.max(...shapes.flatMap((x) => x.o!.map((l) => l.width)), ...current.map((l) => l.width))
  // With only the top edge there is no height yet: size the drawing by its width
  const maxD = Math.max(...shapes.map((x) => x.o![x.o!.length - 1].down), current[current.length - 1]?.down ?? 0) || maxW
  const scale = Math.min((W - PAD * 2) / maxW, (H - PAD * 2) / maxD)
  const left = piece.onFold ? PAD + 24 : W / 2
  const top = (H - maxD * scale) / 2

  const xL = (w: number) => (piece.onFold ? left : left - (w * scale) / 2)
  const xR = (w: number) => (piece.onFold ? left + w * scale : left + (w * scale) / 2)
  const y = (d: number) => top + d * scale
  const path = (o: NonNullable<ReturnType<typeof outline>>) => {
    const right = o.map((l) => `${xR(l.width)},${y(l.down)}`)
    const leftSide = [...o].reverse().map((l) => `${xL(l.width)},${y(l.down)}`)
    return [...right, ...leftSide].join(' ')
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={`${piece.name}, size ${active}`}>
      {/* Other sizes, nested */}
      {shapes
        .filter((x) => x.size !== active)
        .map((x) => (
          <polygon key={x.size} points={path(x.o!)} fill="none" stroke="var(--muted-foreground)" strokeOpacity={0.6} strokeWidth={1} />
        ))}

      {current.length > 0 && (
        <g>
          {current.length === 1 ? (
            <line x1={xL(current[0].width)} x2={xR(current[0].width)} y1={y(0)} y2={y(0)} stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" />
          ) : (
            <polygon
              points={path(current)}
              fill="var(--muted)"
              fillOpacity={complete ? 1 : 0.6}
              stroke="var(--foreground)"
              strokeWidth={1.5}
              strokeDasharray={complete ? undefined : '5 4'}
              strokeLinejoin="round"
            />
          )}

          {/* Each measurement line, with its width */}
          {current.map((l, i) => {
            const yy = y(l.down)
            const inner = i > 0 && i < current.length - 1
            const ty = i === 0 ? yy - 8 : i === current.length - 1 ? yy + 16 : yy - 5
            return (
              <g key={l.label + i}>
                {inner && <line x1={xL(l.width)} x2={xR(l.width)} y1={yy} y2={yy} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeWidth={1} />}
                <text x={(xL(l.width) + xR(l.width)) / 2} y={ty} textAnchor="middle" fontSize={11} fill="var(--foreground)">
                  {l.label} · {l.width} cm
                </text>
              </g>
            )
          })}

          {/* Length, down the side */}
          {current.length > 1 && (() => {
            const last = current[current.length - 1]
            const x = piece.onFold ? xR(Math.max(...current.map((l) => l.width))) + 18 : xL(Math.max(...current.map((l) => l.width))) - 18
            return (
              <g>
                <line x1={x} x2={x} y1={y(0)} y2={y(last.down)} stroke="var(--muted-foreground)" strokeWidth={1} />
                <line x1={x - 4} x2={x + 4} y1={y(0)} y2={y(0)} stroke="var(--muted-foreground)" strokeWidth={1} />
                <line x1={x - 4} x2={x + 4} y1={y(last.down)} y2={y(last.down)} stroke="var(--muted-foreground)" strokeWidth={1} />
                <text x={x} y={y(last.down / 2)} textAnchor="middle" fontSize={11} fill="var(--foreground)" transform={`rotate(-90 ${x} ${y(last.down / 2)})`} dy={piece.onFold ? 12 : -4}>
                  {last.down} cm
                </text>
              </g>
            )
          })()}

          {piece.onFold && current.length > 1 && (
            <g>
              <line x1={left} x2={left} y1={y(0) - 6} y2={y(current[current.length - 1].down) + 6} stroke="var(--foreground)" strokeDasharray="6 4" strokeWidth={1.5} />
              <text x={left - 8} y={y(current[current.length - 1].down / 2)} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)" transform={`rotate(-90 ${left - 8} ${y(current[current.length - 1].down / 2)})`}>
                Fold
              </text>
            </g>
          )}

          <text x={W - 12} y={20} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--foreground)">
            {piece.label} · size {active}
          </text>
        </g>
      )}
    </svg>
  )
}
