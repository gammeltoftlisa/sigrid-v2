'use client'

import { useState, useEffect } from 'react'
import { motion, animate, useMotionValue } from 'framer-motion'
import type { GuidePiece, StepAction, UserMeasurements, PieceDims } from '@/lib/types'

interface Props {
  piece1: GuidePiece
  piece2: GuidePiece
  action: StepAction
  measurements: UserMeasurements
}

const VW = 320
const VH = 380
const PAD = 20
const GAP = 10

function resolveDims(p: GuidePiece, m: UserMeasurements): PieceDims {
  return typeof p.dims === 'function' ? p.dims(m) : p.dims
}

function trapPoints(ox: number, oy: number, pw: number, ph: number, tw: number): string {
  const off = (pw - tw) / 2
  return `${ox + off},${oy} ${ox + off + tw},${oy} ${ox + pw},${oy + ph} ${ox},${oy + ph}`
}

function mirrorPoints(ox: number, oy: number, pw: number, ph: number, tw: number): string {
  // Mirror the trapezoid horizontally around its own center x = ox + pw/2
  // x → 2*(ox + pw/2) - x = 2*ox + pw - x
  const off = (pw - tw) / 2
  const mx = (x: number) => 2 * ox + pw - x
  return [
    `${mx(ox + off)},${oy}`,
    `${mx(ox + off + tw)},${oy}`,
    `${mx(ox + pw)},${oy + ph}`,
    `${mx(ox)},${oy + ph}`,
  ].join(' ')
}

export default function JoinCanvas({ piece1, piece2, action, measurements }: Props) {
  const dims1 = resolveDims(piece1, measurements)
  const dims2 = resolveDims(piece2, measurements)

  const availH = VH - PAD * 2
  const halfW  = (VW - PAD * 2 - GAP) / 2

  const scale = Math.min(
    halfW / Math.max(dims1.bottomWidth, dims1.topWidth, dims2.bottomWidth, dims2.topWidth),
    availH / Math.max(dims1.height, dims2.height),
  )

  // Piece 1 — right-aligned in left half (seam edge on the right)
  const pw1 = dims1.bottomWidth * scale
  const ph1 = dims1.height * scale
  const tw1 = dims1.topWidth * scale
  const ox1 = PAD + halfW - pw1
  const oy1 = (VH - ph1) / 2
  const pts1 = trapPoints(ox1, oy1, pw1, ph1, tw1)

  // Piece 2 — left-aligned in right half, mirrored (seam edge on the left)
  const pw2 = dims2.bottomWidth * scale
  const ph2 = dims2.height * scale
  const tw2 = dims2.topWidth * scale
  const ox2 = PAD + halfW + GAP
  const oy2 = (VH - ph2) / 2
  const pts2 = mirrorPoints(ox2, oy2, pw2, ph2, tw2)

  // Seam line runs vertically at center, bounded by the overlap of both pieces
  const centerX  = PAD + halfW + GAP / 2
  const seamY1   = Math.max(oy1, oy2) + 6
  const seamY2   = Math.min(oy1 + ph1, oy2 + ph2) - 6
  const seamLen  = seamY2 - seamY1

  const isSewing = action === 'sew' || action === 'attach'

  // Needle travels along the seam for sew/attach steps
  const progress = useMotionValue(0)
  const [needleY, setNeedleY] = useState(seamY1)

  useEffect(() => {
    if (!isSewing) return
    const ctrl = animate(progress, 1, {
      duration: 2.2,
      delay: 0.5,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatDelay: 0.6,
    })
    const unsub = progress.on('change', (v) => setNeedleY(seamY1 + v * seamLen))
    return () => { ctrl.stop(); unsub() }
  }, [isSewing, seamY1, seamLen])

  const fill = 'var(--sig-primary-soft)'
  const linen = 'url(#linen-j)'

  return (
    <motion.svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      height="100%"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <defs>
        <pattern id="linen-j" patternUnits="userSpaceOnUse" width="6" height="6">
          <line x1="0" y1="0" x2="6" y2="6" stroke="var(--sig-border)" strokeWidth="0.5" opacity="0.4" />
          <line x1="6" y1="0" x2="0" y2="6" stroke="var(--sig-border)" strokeWidth="0.5" opacity="0.4" />
        </pattern>
      </defs>

      {/* ── Piece 1 ── */}
      <polygon points={pts1} fill={fill} stroke="var(--sig-border)" strokeWidth={1.5} />
      <polygon points={pts1} fill={linen} />
      <motion.text
        x={ox1 + pw1 / 2} y={oy1 + 18}
        textAnchor="middle" dominantBaseline="middle"
        fill="var(--sig-primary-deep)" fontSize={13} fontWeight="700"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      >
        {piece1.label}
      </motion.text>

      {/* ── Piece 2 (mirrored) ── */}
      <polygon points={pts2} fill={fill} stroke="var(--sig-border)" strokeWidth={1.5} />
      <polygon points={pts2} fill={linen} />
      <motion.text
        x={ox2 + pw2 / 2} y={oy2 + 18}
        textAnchor="middle" dominantBaseline="middle"
        fill="var(--sig-primary-deep)" fontSize={13} fontWeight="700"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
      >
        {piece2.label}
      </motion.text>

      {/* ── Seam annotation ── */}
      {isSewing ? (
        /* Animated sewing line */
        <>
          <motion.line
            x1={centerX} y1={seamY1} x2={centerX} y2={seamY2}
            stroke="var(--sig-primary)"
            strokeWidth={2.5}
            strokeDasharray="6 3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.circle
            cx={centerX} cy={needleY} r={5}
            fill="var(--sig-primary-deep)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          />
        </>
      ) : (
        /* Pin row */
        <>
          <line
            x1={centerX} y1={seamY1} x2={centerX} y2={seamY2}
            stroke="var(--sig-rim)"
            strokeWidth={1}
            strokeDasharray="3 5"
          />
          {Array.from({ length: 5 }, (_, i) => {
            const y = seamY1 + (i + 0.5) * (seamLen / 5)
            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18 + i * 0.09, type: 'spring', stiffness: 380, damping: 20 }}
                style={{ transformOrigin: `${centerX}px ${y}px` }}
              >
                <circle cx={centerX} cy={y} r={4} fill="var(--sig-primary)" />
                <line
                  x1={centerX - 12} y1={y} x2={centerX + 12} y2={y}
                  stroke="var(--sig-ink-3)" strokeWidth={1.5}
                />
              </motion.g>
            )
          })}
        </>
      )}

      {/* Label */}
      <motion.text
        x={VW / 2} y={VH - 10}
        textAnchor="middle"
        fill="var(--sig-ink-3)" fontSize={10} fontWeight="500"
        initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.7 }}
      >
        right sides together
      </motion.text>
    </motion.svg>
  )
}
