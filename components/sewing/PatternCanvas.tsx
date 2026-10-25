'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { IconYarn, IconScissors } from '@tabler/icons-react'
import { outlinePath, outlineSize, type PieceOutline } from '@/lib/piece-outline'
import { isSecondCut, pieceOf, type Assembly, type AssemblyMember } from '@/lib/assembly'
import type { GuidePiece, StepAction, StepAnnotation, FabricSide, UserMeasurements, PieceDims } from '@/lib/types'

interface Props {
  piece: GuidePiece | null
  action: StepAction
  annotation?: StepAnnotation
  fabricSide?: FabricSide
  measurements: UserMeasurements
  /** Shown when the step has no pattern piece to draw */
  title?: string
  /**
   * For steps about pieces that are (being) sewn together: the set already joined and the pieces
   * joining it now, by id ("<id>#2" is a piece's second cut). Drawn together, and animated.
   */
  assembly?: Assembly | null
  /** Every piece of the pattern, to look the assembly's pieces up in */
  pieces?: GuidePiece[]
}

const VIEWBOX_W = 320
const VIEWBOX_H = 380
const PAD = 40

function resolveDims(piece: GuidePiece, m: UserMeasurements): PieceDims {
  return typeof piece.dims === 'function' ? piece.dims(m) : piece.dims
}

// Scale cm dimensions to fit within the viewbox
function computePoints(dims: PieceDims): { points: string; pxPerCm: number; ox: number; oy: number; pw: number; ph: number } {
  const maxW = VIEWBOX_W - PAD * 2
  const maxH = VIEWBOX_H - PAD * 2
  const widestCm = Math.max(dims.topWidth, dims.bottomWidth)
  const scale = Math.min(maxW / widestCm, maxH / dims.height)
  const pw = dims.bottomWidth * scale
  const ph = dims.height * scale
  const tw = dims.topWidth * scale
  const ox = (VIEWBOX_W - pw) / 2
  const oy = (VIEWBOX_H - ph) / 2
  const offset = (pw - tw) / 2
  const points = `${ox + offset},${oy} ${ox + offset + tw},${oy} ${ox + pw},${oy + ph} ${ox},${oy + ph}`
  return { points, pxPerCm: scale, ox, oy, pw, ph }
}

/** The piece's real outline fitted into the drawing, with its bounding box for the annotations */
function fitOutline(o: PieceOutline) {
  const size = outlineSize(o)
  const pxPerCm = Math.min((VIEWBOX_W - PAD * 2) / size.width, (VIEWBOX_H - PAD * 2) / size.height)
  const pw = size.width * pxPerCm
  const ph = size.height * pxPerCm
  const ox = (VIEWBOX_W - pw) / 2
  const oy = (VIEWBOX_H - ph) / 2
  // On the fold the fold sits at the left edge; otherwise the outline is centred
  const left = o.onFold ? ox : VIEWBOX_W / 2
  return { d: outlinePath(o, { left, top: oy, scale: pxPerCm }), points: '', pxPerCm, ox, oy, pw, ph }
}

function edgeCoords(edge: string, ox: number, oy: number, pw: number, ph: number, dims: PieceDims) {
  const tw = dims.topWidth
  const bw = dims.bottomWidth
  const scale = pw / bw
  const topOffset = ((bw - tw) / 2) * scale
  switch (edge) {
    case 'top':    return { x1: ox + topOffset, y1: oy, x2: ox + topOffset + tw * scale, y2: oy }
    case 'bottom': return { x1: ox, y1: oy + ph, x2: ox + pw, y2: oy + ph }
    case 'left':   return { x1: ox + topOffset, y1: oy, x2: ox, y2: oy + ph }
    case 'right':  return { x1: ox + topOffset + tw * scale, y1: oy, x2: ox + pw, y2: oy + ph }
    default:       return { x1: ox, y1: oy + ph / 2, x2: ox + pw, y2: oy + ph / 2 }
  }
}

// ── Sub-renderers ────────────────────────────────────────────────────────────

function CutAnnotation({ edge, ox, oy, pw, ph, dims }: { edge: string; ox: number; oy: number; pw: number; ph: number; dims: PieceDims }) {
  const c = edgeCoords(edge, ox, oy, pw, ph, dims)
  return (
    <motion.line
      x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
      stroke="var(--sig-danger)"
      strokeWidth={3}
      strokeDasharray="8 4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
    />
  )
}

function SewAnnotation({ edge, amount, ox, oy, pw, ph, dims, pxPerCm }: { edge: string; amount?: number; ox: number; oy: number; pw: number; ph: number; dims: PieceDims; pxPerCm: number }) {
  const inset = (amount ?? 1.5) * pxPerCm
  const insetMap: Record<string, { dx: number; dy: number }> = {
    left: { dx: inset, dy: 0 },
    right: { dx: -inset, dy: 0 },
    top: { dx: 0, dy: inset },
    bottom: { dx: 0, dy: -inset },
  }
  const shift = insetMap[edge] ?? { dx: 0, dy: inset }
  const c = edgeCoords(edge, ox, oy, pw, ph, dims)
  const pathData = `M ${c.x1 + shift.dx} ${c.y1 + shift.dy} L ${c.x2 + shift.dx} ${c.y2 + shift.dy}`

  // Needle dot travels along path
  const progress = useMotionValue(0)
  const [dot, setDot] = useState({ x: c.x1 + shift.dx, y: c.y1 + shift.dy })
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const ctrl = animate(progress, 1, { duration: 2, delay: 0.4, ease: 'easeInOut' })
    const unsub = progress.on('change', (v) => {
      if (!pathRef.current) return
      const len = pathRef.current.getTotalLength()
      const pt = pathRef.current.getPointAtLength(v * len)
      setDot({ x: pt.x, y: pt.y })
    })
    return () => { ctrl.stop(); unsub() }
  }, [edge, ox, oy, progress])

  return (
    <g>
      <motion.path
        ref={pathRef}
        d={pathData}
        stroke="var(--sig-primary)"
        strokeWidth={2.5}
        strokeDasharray="6 3"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeInOut', delay: 0.4 }}
      />
      <motion.circle
        cx={dot.x} cy={dot.y} r={5}
        fill="var(--sig-primary-deep)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
    </g>
  )
}

function PinAnnotation({ edge, ox, oy, pw, ph, dims, pxPerCm }: { edge: string; ox: number; oy: number; pw: number; ph: number; dims: PieceDims; pxPerCm: number }) {
  const c = edgeCoords(edge, ox, oy, pw, ph, dims)
  const dx = c.x2 - c.x1
  const dy = c.y2 - c.y1
  const len = Math.hypot(dx, dy)
  const pinSpacing = 5 * pxPerCm
  const count = Math.max(3, Math.floor(len / pinSpacing))
  const pins = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count
    return { x: c.x1 + dx * t, y: c.y1 + dy * t }
  })

  return (
    <g>
      {pins.map((p, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 400, damping: 20 }}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        >
          {/* Pin head */}
          <circle cx={p.x} cy={p.y} r={4} fill="var(--sig-primary)" />
          {/* Pin shaft */}
          <line
            x1={p.x} y1={p.y}
            x2={p.x + (edge === 'left' ? 8 : edge === 'right' ? -8 : 0)}
            y2={p.y + (edge === 'top' ? 8 : edge === 'bottom' ? -8 : 0)}
            stroke="var(--sig-ink-3)" strokeWidth={1.5}
          />
        </motion.g>
      ))}
    </g>
  )
}

function FoldAnnotation({ edge, amount, ox, oy, pw, ph, pxPerCm, fabricSide }: { edge: string; amount?: number; ox: number; oy: number; pw: number; ph: number; pxPerCm: number; fabricSide?: FabricSide }) {
  const foldPx = (amount ?? 2) * pxPerCm

  // The fold-line and the folded strip
  let foldLineY = oy
  let foldStripPoints = ''
  if (edge === 'bottom') {
    foldLineY = oy + ph - foldPx
    foldStripPoints = `${ox},${foldLineY} ${ox + pw},${foldLineY} ${ox + pw},${oy + ph} ${ox},${oy + ph}`
  } else if (edge === 'top') {
    foldLineY = oy + foldPx
    foldStripPoints = `${ox},${oy} ${ox + pw},${oy} ${ox + pw},${foldLineY} ${ox},${foldLineY}`
  }

  return (
    <g>
      {/* Fold strip — animates scaleY to simulate fold */}
      <motion.polygon
        points={foldStripPoints}
        fill={fabricSide === 'wrong' ? 'var(--sig-primary-soft)' : 'var(--sig-surface-2)'}
        initial={{ scaleY: 1, opacity: 1 }}
        animate={{ scaleY: 0.05, opacity: 0.6 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformOrigin: `${ox + pw / 2}px ${foldLineY}px` }}
      />
      {/* Fold line */}
      <motion.line
        x1={ox} y1={foldLineY} x2={ox + pw} y2={foldLineY}
        stroke="var(--sig-ink-2)"
        strokeWidth={2}
        strokeDasharray="6 4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      />
      {/* Fold arrow */}
      <motion.text
        x={ox + pw / 2} y={foldLineY - 8}
        textAnchor="middle"
        fill="var(--sig-ink-2)"
        fontSize={11}
        fontWeight="600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {amount ? `${amount} cm` : 'fold'}
      </motion.text>
    </g>
  )
}

function MeasureArrow({ edge, ox, oy, pw, ph, dims }: { edge: string; ox: number; oy: number; pw: number; ph: number; dims: PieceDims }) {
  const c = edgeCoords(edge, ox, oy, pw, ph, dims)
  const mid = { x: (c.x1 + c.x2) / 2, y: (c.y1 + c.y2) / 2 }
  const labelW = edge === 'top' ? dims.topWidth : dims.bottomWidth

  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
      <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="var(--sig-primary)" strokeWidth={1.5} />
      {/* arrowheads */}
      <polygon points={`${c.x1},${c.y1} ${c.x1 + 6},${c.y1 - 3} ${c.x1 + 6},${c.y1 + 3}`} fill="var(--sig-primary)" />
      <polygon points={`${c.x2},${c.y2} ${c.x2 - 6},${c.y2 - 3} ${c.x2 - 6},${c.y2 + 3}`} fill="var(--sig-primary)" />
      <rect x={mid.x - 22} y={mid.y - 9} width={44} height={18} rx={4} fill="var(--sig-surface)" />
      <text x={mid.x} y={mid.y + 4} textAnchor="middle" fill="var(--sig-primary-deep)" fontSize={11} fontWeight="700">
        {labelW} cm
      </text>
    </motion.g>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PatternCanvas({ piece, action, annotation, fabricSide, measurements, title, assembly, pieces }: Props) {
  if (assembly && pieces && assembly.base.length + assembly.joining.flat().length > 1) {
    return <AssemblyDrawing assembly={assembly} pieces={pieces} measurements={measurements} />
  }
  // No piece to show (a prepare step without one): an illustration instead. A step that names a
  // piece always shows it, whatever kind of step it is.
  if (!piece) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-surface-2 rounded-3xl">
        {action === 'prepare' ? (
          <IconYarn size={56} className="text-ink-3" stroke={1.5} />
        ) : (
          <IconScissors size={56} className="text-ink-3" stroke={1.5} />
        )}
        <p className="text-label text-ink-2 font-medium text-center px-6">{title ?? 'Get ready'}</p>
      </div>
    )
  }

  const dims = resolveDims(piece, measurements)
  const shape = piece.outline && piece.outline.lines.length >= 2 ? fitOutline(piece.outline) : null
  const { points, pxPerCm, ox, oy, pw, ph } = shape ?? computePoints(dims)

  const isWrong = fabricSide === 'wrong'
  const fillColor = isWrong ? 'var(--sig-surface-2)' : 'var(--sig-primary-soft)'
  const seamPx = (piece.seamAllowance ?? 1.5) * pxPerCm

  // Seam allowance inset polygon (simplified: just shrink uniformly)
  const tw = dims.topWidth * pxPerCm
  const bw = dims.bottomWidth * pxPerCm
  const topOffset = (bw - tw) / 2
  const innerPoints = [
    `${ox + topOffset + seamPx},${oy + seamPx}`,
    `${ox + topOffset + tw - seamPx},${oy + seamPx}`,
    `${ox + bw - seamPx},${oy + ph - seamPx}`,
    `${ox + seamPx},${oy + ph - seamPx}`,
  ].join(' ')

  // Grain line
  const grainMid = ox + pw / 2
  const grainY1 = oy + ph * 0.3
  const grainY2 = oy + ph * 0.7

  return (
    <motion.svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      width="100%"
      height="100%"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <defs>
        {/* Linen texture pattern */}
        <pattern id="linen" patternUnits="userSpaceOnUse" width="6" height="6">
          <line x1="0" y1="0" x2="6" y2="6" stroke="var(--sig-border)" strokeWidth="0.5" opacity="0.5" />
          <line x1="6" y1="0" x2="0" y2="6" stroke="var(--sig-border)" strokeWidth="0.5" opacity="0.5" />
        </pattern>
      </defs>

      {/* Main shape — fabric fill (the real outline when the piece has one) */}
      {shape ? (
        <>
          <path d={shape.d} fill={fillColor} stroke="var(--sig-border)" strokeWidth={1.5} strokeLinejoin="round" />
          <path d={shape.d} fill="url(#linen)" />
          {piece.outline?.onFold && (
            <line x1={shape.ox} x2={shape.ox} y1={shape.oy} y2={shape.oy + shape.ph} stroke="var(--sig-ink-3)" strokeWidth={1.5} strokeDasharray="6 4" />
          )}
        </>
      ) : (
        <>
          <polygon points={points} fill={fillColor} stroke="var(--sig-border)" strokeWidth={1.5} />
          {/* Linen texture overlay */}
          <polygon points={points} fill="url(#linen)" />
        </>
      )}

      {/* Wrong-side label */}
      {isWrong && (
        <motion.text
          x={VIEWBOX_W / 2} y={oy + ph / 2}
          textAnchor="middle" dominantBaseline="middle"
          fill="var(--sig-ink-3)" fontSize={10} fontWeight="500" opacity={0.6}
          initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.5 }}
        >
          wrong side
        </motion.text>
      )}

      {/* Seam allowance dashed inset: the outline drawn a seam allowance smaller around its middle */}
      {shape ? (
        <path
          d={shape.d}
          fill="none"
          stroke="var(--sig-border)"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.7}
          transform={`translate(${ox + pw / 2} ${oy + ph / 2}) scale(${Math.max(0.5, 1 - (2 * seamPx) / pw)} ${Math.max(0.5, 1 - (2 * seamPx) / ph)}) translate(${-(ox + pw / 2)} ${-(oy + ph / 2)})`}
        />
      ) : (
      <polygon
        points={innerPoints}
        fill="none"
        stroke="var(--sig-border)"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      )}

      {/* Grain line */}
      {piece.grainLine === 'vertical' && (
        <g opacity={0.5}>
          <line x1={grainMid} y1={grainY1} x2={grainMid} y2={grainY2} stroke="var(--sig-ink-3)" strokeWidth={1.5} />
          <polygon points={`${grainMid},${grainY1} ${grainMid - 4},${grainY1 + 7} ${grainMid + 4},${grainY1 + 7}`} fill="var(--sig-ink-3)" />
          <polygon points={`${grainMid},${grainY2} ${grainMid - 4},${grainY2 - 7} ${grainMid + 4},${grainY2 - 7}`} fill="var(--sig-ink-3)" />
        </g>
      )}
      {piece.grainLine === 'horizontal' && (
        <g opacity={0.5}>
          <line x1={ox + pw * 0.3} y1={oy + ph / 2} x2={ox + pw * 0.7} y2={oy + ph / 2} stroke="var(--sig-ink-3)" strokeWidth={1.5} />
          <polygon points={`${ox + pw * 0.3},${oy + ph / 2} ${ox + pw * 0.3 + 7},${oy + ph / 2 - 4} ${ox + pw * 0.3 + 7},${oy + ph / 2 + 4}`} fill="var(--sig-ink-3)" />
          <polygon points={`${ox + pw * 0.7},${oy + ph / 2} ${ox + pw * 0.7 - 7},${oy + ph / 2 - 4} ${ox + pw * 0.7 - 7},${oy + ph / 2 + 4}`} fill="var(--sig-ink-3)" />
        </g>
      )}

      {/* Piece label */}
      <motion.text
        x={ox + pw - 16} y={oy + 20}
        textAnchor="middle" dominantBaseline="middle"
        fill="var(--sig-primary-deep)" fontSize={13} fontWeight="700"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      >
        {piece.label}
      </motion.text>

      {/* Per-action annotation */}
      {annotation?.type === 'cut-line' && (
        <CutAnnotation
          edge={annotation.edge ?? 'bottom'}
          ox={ox} oy={oy} pw={pw} ph={ph} dims={dims}
        />
      )}
      {annotation?.type === 'sew-line' && (
        <SewAnnotation
          edge={annotation.edge ?? 'left'}
          amount={annotation.amount}
          ox={ox} oy={oy} pw={pw} ph={ph} dims={dims} pxPerCm={pxPerCm}
        />
      )}
      {annotation?.type === 'pin-row' && (
        <PinAnnotation
          edge={annotation.edge ?? 'left'}
          ox={ox} oy={oy} pw={pw} ph={ph} dims={dims} pxPerCm={pxPerCm}
        />
      )}
      {annotation?.type === 'fold-line' && (
        <FoldAnnotation
          edge={annotation.edge ?? 'bottom'}
          amount={annotation.amount}
          ox={ox} oy={oy} pw={pw} ph={ph} pxPerCm={pxPerCm}
          fabricSide={fabricSide}
        />
      )}
      {annotation?.type === 'measure-arrow' && (
        <MeasureArrow
          edge={annotation.edge ?? 'top'}
          ox={ox} oy={oy} pw={pw} ph={ph} dims={dims}
        />
      )}
    </motion.svg>
  )
}

/** A piece's outline: its real one when known, otherwise its top width, bottom width and length */
function outlineOf(piece: GuidePiece, m: UserMeasurements): PieceOutline {
  if (piece.outline && piece.outline.lines.length >= 2) return piece.outline
  const d = resolveDims(piece, m)
  return { lines: [{ down: 0, width: d.topWidth }, { down: d.height, width: d.bottomWidth }] }
}

/** Once cut, a piece cut on the fold is a whole piece: drawn opened out, twice as wide */
const opened = (o: PieceOutline): PieceOutline =>
  o.onFold ? { ...o, onFold: false, lines: o.lines.map((l) => ({ ...l, width: l.width * 2 })) } : o

type Placed = { id: string; piece: GuidePiece; o: PieceOutline; x: number; y: number; w: number; h: number }
type Box = { x: number; y: number; w: number; h: number }
const boxOf = (items: { x: number; y: number; w: number; h: number }[]): Box => {
  const x = Math.min(...items.map((i) => i.x))
  const y = Math.min(...items.map((i) => i.y))
  return { x, y, w: Math.max(...items.map((i) => i.x + i.w)) - x, h: Math.max(...items.map((i) => i.y + i.h)) - y }
}

/** Where a piece goes when it's attached to another, in cm (x, y is its top left) */
function attach(to: Box, w: number, h: number, via: 'side' | 'top' | 'layer') {
  if (via === 'side') return { x: to.x + to.w, y: to.y }
  if (via === 'top') return { x: to.x + to.w / 2 - w / 2, y: to.y - h }
  // Laid on: a piece at least half as long lines up with the top (an overlay at the neckline,
  // a pocket bag hanging from its welt); a small one sits a little over halfway down (a welt)
  return h > to.h * 0.4 ? { x: to.x + to.w / 2 - w / 2, y: to.y } : { x: to.x + to.w / 2 - w / 2, y: to.y + to.h * 0.55 - h / 2 }
}

/**
 * Lays out a set of pieces in the order they were attached. Each group that was attached is
 * laid out on its own first, then moved so the piece that touches lands on the piece it was
 * sewn to, so pieces joined earlier keep their places.
 */
function layout(members: AssemblyMember[], pieces: GuidePiece[], m: UserMeasurements): Placed[] {
  const placed: Placed[] = []
  let i = 0
  while (i < members.length) {
    const mem = members[i]
    const n = i === 0 ? 1 : Math.max(1, mem.n ?? 1)
    if (i === 0 || !mem.via) {
      const piece = pieces.find((p) => p.id === pieceOf(mem.id))
      if (piece) {
        const o = opened(outlineOf(piece, m))
        const { width: w, height: h } = outlineSize(o)
        const at = placed.length === 0 ? { x: 0, y: 0 } : attach(boxOf(placed), w, h, 'side')
        placed.push({ id: mem.id, piece, o, x: at.x, y: at.y, w, h })
      }
      i += 1
      continue
    }
    const group = layout([{ id: mem.id }, ...members.slice(i + 1, i + n)], pieces, m)
    i += n
    if (group.length === 0) continue
    let contact = group.find((g) => g.id === mem.contact) ?? group[0]
    const ti = Math.max(0, placed.findIndex((g) => g.id === mem.to))
    const to = placed[ti]
    if (!to) continue
    // A piece's two cuts sewn side by side are the two halves of one piece (a centre back
    // seam): each is drawn as a half, meeting along the seam
    if (mem.via === 'side' && pieceOf(contact.id) === pieceOf(to.id) && !to.o.onFold && !contact.o.onFold) {
      const left = halfOf(to, true)
      placed[ti] = { ...left, x: to.x + to.w / 2 - left.w }
      const right = halfOf(contact, false)
      group[group.indexOf(contact)] = right
      contact = right
      const at = { x: to.x + to.w / 2, y: to.y }
      placed.push(...group.map((g) => ({ ...g, x: g.x - contact.x + at.x, y: g.y - contact.y + at.y })))
      continue
    }
    const at = attach(to, contact.w, contact.h, mem.via)
    // Side by side, the touching piece meets its partner; on top or above, the group is centred
    const gb = boxOf(group)
    const dx = mem.via === 'side' ? at.x - contact.x : to.x + to.w / 2 - (gb.x + gb.w / 2)
    const dy = at.y - contact.y
    placed.push(...group.map((g) => ({ ...g, x: g.x + dx, y: g.y + dy })))
  }
  return placed
}

/** A piece drawn as one half of a pair: straight edge on the right (the left half) or the left */
function halfOf(p: Placed, leftHalf: boolean): Placed {
  const o = { ...p.o, onFold: true, mirror: leftHalf }
  const { width: w } = outlineSize(o)
  return { ...p, o, w }
}

/** The x the outline is drawn from: its centre line, or its straight edge for a half */
const lineX = (p: Placed) => (p.o.onFold ? (p.o.mirror ? p.x + p.w : p.x) : p.x + p.w / 2)

/**
 * Pieces being put together. The set already sewn sits still; the pieces joining it come in
 * from the side or from above and meet it. When a piece goes onto a curved neckline, its edge
 * bends to follow the curve. Then the seam shows as a stitch line. Reduced motion: just the result.
 */
function AssemblyDrawing({ assembly, pieces, measurements }: { assembly: Assembly; pieces: GuidePiece[]; measurements: UserMeasurements }) {
  const reduce = useReducedMotion()
  const still = !!reduce || assembly.joining.length === 0
  // Progress of the join, 0 → 1, driven by motion; the drawing re-renders as it moves
  const progress = useMotionValue(0)
  const [t, setT] = useState(0)
  useMotionValueEvent(progress, 'change', setT)
  const [run, setRun] = useState(0)
  const stepKey = JSON.stringify(assembly)
  useEffect(() => {
    if (still) return
    progress.jump(0)
    const controls = animate(progress, 1, { duration: 1.2, delay: 0.35, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [stepKey, run, still, progress])

  // Everything as it will be once joined; the base is the part that was sewn before
  const laid = layout([...assembly.base, ...assembly.joining.flat()], pieces, measurements)
  const base = laid.filter((p) => assembly.base.some((m) => m.id === p.id))
  if (base.length === 0) return null
  const joining = assembly.joining.map((g) => laid.filter((p) => g.some((m) => m.id === p.id)))
  // The two pieces that meet: the one sewn to, and the one of each joining set that touches it
  const first = assembly.joining[0]?.[0]
  const anchor = base.find((p) => p.id === first?.to) ?? base[0]
  const contact = joining[0]?.find((p) => p.id === first?.contact)
  // A neckline to bend onto: the scoop of the piece the collar goes on
  const scoop = assembly.join === 'top' ? (anchor.o.necklineDepth ?? 0) : 0
  const all = laid
  const box = boxOf(all)
  const scale = Math.min((VIEWBOX_W - PAD * 2) / box.w, (VIEWBOX_H - PAD * 2) / box.h)
  const ox = (VIEWBOX_W - box.w * scale) / 2 - box.x * scale
  const oy = (VIEWBOX_H - box.h * scale) / 2 - box.y * scale
  // Where the joining pieces start: a little away, in the direction they come from
  const away = { side: { x: 0.35, y: 0 }, top: { x: 0, y: -0.45 }, layer: { x: 0, y: -0.3 } }[assembly.join]
  const e = still ? 1 : t
  const dx = (1 - e) * away.x * Math.max(anchor.w, 20) * scale
  const dy = (1 - e) * away.y * Math.max(anchor.h, 20) * scale
  // One label per spot: pieces laid on one their own size (interfacing, a second layer) share it
  const labels: { x: number; y: number; text: string; moving: boolean }[] = []
  for (const p of all) {
    const moving = joining.some((g) => g.includes(p))
    const x = ox + (p.x + p.w / 2) * scale + (moving ? dx : 0)
    // Inside the piece: a little above its middle, clear of a sloping top edge
    const ph = p.h * scale
    const y = oy + p.y * scale + (ph > 30 ? Math.min(ph * 0.42, 60) : ph / 2 + 4) + (moving ? dy : 0)
    const text = `${p.piece.label}${isSecondCut(p.id) ? '²' : ''}`
    const near = labels.find((q) => Math.abs(q.x - x) < 18 && Math.abs(q.y - y) < 12)
    if (near) near.text += ` · ${text}`
    else labels.push({ x, y, text, moving })
  }

  const draw = (p: Placed, moving: boolean) => {
    const o = moving && scoop ? { ...p.o, hemCurve: scoop * e } : p.o
    const interfacing = p.piece.material === 'interfacing'
    // Interfacing is a touch smaller and see-through, so the fabric it's ironed onto shows
    const k = interfacing ? 0.92 : 1
    const left = ox + (p.x + (lineX(p) - p.x - p.w / 2) * k + p.w / 2) * scale + (moving ? dx : 0)
    const top = oy + (p.y + (p.h * (1 - k)) / 2) * scale + (moving ? dy : 0)
    return (
      <g key={p.id} opacity={moving && assembly.join === 'layer' ? 0.45 + 0.5 * e : 1}>
        <path
          d={outlinePath(o, { left, top, scale: scale * k })}
          fill={interfacing ? 'var(--sig-surface)' : 'var(--sig-primary-soft)'}
          fillOpacity={interfacing ? 0.7 : 1}
          stroke="var(--sig-ink-2)"
          strokeWidth={1.25}
          strokeDasharray={moving && e < 1 ? '5 3' : interfacing ? '2 2' : undefined}
          strokeLinejoin="round"
        />
      </g>
    )
  }

  // The seam, once joined: along the meeting edge
  const seam = (() => {
    // Interfacing is ironed on, not sewn
    if (e < 1 || !contact || joining.flat().every((p) => p.piece.material === 'interfacing')) return null
    const j = contact
    const X = (cm: number) => ox + cm * scale
    const Y = (cm: number) => oy + cm * scale
    if (assembly.join === 'side') return <line x1={X(j.x)} x2={X(j.x)} y1={Y(j.y)} y2={Y(j.y + Math.min(j.h, anchor.h))} />
    if (assembly.join === 'top') {
      const yb = Y(anchor.y)
      return <path d={`M${X(j.x)},${yb} Q${X(j.x + j.w / 2)},${yb + scoop * 2 * scale} ${X(j.x + j.w)},${yb}`} fill="none" />
    }
    // Laid on: along the top of everything laid on (both halves of an overlay)
    const g = boxOf(joining[0])
    return <line x1={X(g.x) + 4} x2={X(g.x + g.w) - 4} y1={Y(g.y) + 3} y2={Y(g.y) + 3} />
  })()

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} width="100%" height="100%" role="img" aria-label={assemblyLabel(base, joining)}>
        {base.map((p) => draw(p, false))}
        {joining.flat().map((p) => draw(p, true))}
        {labels.map((l) => (
          <text key={`${l.x},${l.y}`} x={l.x} y={l.y} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--sig-primary-deep)">
            {l.text}
          </text>
        ))}
        {seam && (
          <g stroke="var(--sig-primary)" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round">
            {seam}
          </g>
        )}
      </svg>
      {assembly.joining.length > 0 && !reduce && (
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="glass-inset-hover absolute right-3 bottom-3 rounded-full bg-card px-3 py-1 text-xs font-medium"
        >
          Show again
        </button>
      )}
    </div>
  )
}

const assemblyLabel = (base: Placed[], joining: Placed[][]) => {
  const names = (ps: Placed[]) => [...new Set(ps.map((p) => (isSecondCut(p.id) ? `second ${p.piece.label}` : p.piece.label)))].join(' and ')
  return joining.length ? `${names(joining.flat())} joining ${names(base)}` : `${names(base)}, sewn together`
}
