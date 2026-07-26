'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, animate, useMotionValue } from 'framer-motion'
import type { GuidePiece, StepAction, StepAnnotation, FabricSide, UserMeasurements, PieceDims } from '@/lib/types'

interface Props {
  piece: GuidePiece | null
  action: StepAction
  annotation?: StepAnnotation
  fabricSide?: FabricSide
  measurements: UserMeasurements
}

const VIEWBOX_W = 320
const VIEWBOX_H = 380
const PAD = 40

const TOOL_ICONS: Record<string, string> = {
  scissors: '✂️',
  pins: '📌',
  needle: '🧵',
  iron: '🔥',
  chalk: '✏️',
  ruler: '📏',
}

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
  const len = Math.hypot(c.x2 - c.x1, c.y2 - c.y1)
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
  }, [edge, ox, oy])

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

function FoldAnnotation({ edge, amount, ox, oy, pw, ph, dims, pxPerCm, fabricSide }: { edge: string; amount?: number; ox: number; oy: number; pw: number; ph: number; dims: PieceDims; pxPerCm: number; fabricSide?: FabricSide }) {
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
  const len = Math.hypot(c.x2 - c.x1, c.y2 - c.y1)
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

export default function PatternCanvas({ piece, action, annotation, fabricSide, measurements }: Props) {
  // Prepare step — no piece
  if (!piece || action === 'prepare') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-surface-2 rounded-3xl">
        <div className="text-6xl">
          {action === 'prepare' ? '🧶' : '✂️'}
        </div>
        <p className="text-label text-ink-3 font-medium">Get ready</p>
      </div>
    )
  }

  const dims = resolveDims(piece, measurements)
  const { points, pxPerCm, ox, oy, pw, ph } = computePoints(dims)

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

      {/* Main shape — fabric fill */}
      <polygon points={points} fill={fillColor} stroke="var(--sig-border)" strokeWidth={1.5} />
      {/* Linen texture overlay */}
      <polygon points={points} fill="url(#linen)" />

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

      {/* Seam allowance dashed inset */}
      <polygon
        points={innerPoints}
        fill="none"
        stroke="var(--sig-border)"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.7}
      />

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
          ox={ox} oy={oy} pw={pw} ph={ph} dims={dims} pxPerCm={pxPerCm}
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
