/**
 * A pattern piece's real outline, described the way the studio measures it: lines across the
 * piece from top to bottom (cm from the top, cm wide), how each side bows between two lines
 * (cm at its middle: plus out, minus in), an optional scooped top edge, and whether it's cut on
 * the fold (then it's the half piece, with the fold on the left, or on the right when mirrored).
 */
export interface PieceOutline {
  lines: { down: number; width: number; curve?: number }[]
  onFold?: boolean
  /** A half drawn the other way round, its straight edge on the right (the left half of a pair) */
  mirror?: boolean
  /** Depth of a scooped top edge at the middle, in cm */
  necklineDepth?: number
  /** How far the bottom edge bows down at its middle, in cm (minus bows up); used when a collar bends onto a neckline */
  hemCurve?: number
}

/**
 * The outline as an SVG path. `left` is the centre line (or the fold), `top` the y of the top
 * line, `scale` px per cm. Shared by the studio drawing and the sewer's guide so both show the
 * same shape.
 */
export function outlinePath(o: PieceOutline, { left, top, scale }: { left: number; top: number; scale: number }): string {
  const f = (n: number) => n.toFixed(1)
  // x values, flipped about the fold for a mirrored half
  const fx = (n: number) => f(o.onFold && o.mirror ? 2 * left - n : n)
  const xL = (w: number) => (o.onFold ? left : left - (w * scale) / 2)
  const xR = (w: number) => (o.onFold ? left + w * scale : left + (w * scale) / 2)
  const y = (d: number) => top + d * scale
  const R = o.lines.map((l) => ({ x: xR(l.width), y: y(l.down) }))
  const L = o.lines.map((l) => ({ x: xL(l.width), y: y(l.down) }))
  // A quadratic bows half as far as its control point, so it sits twice the curve away
  const control = (a: { x: number; y: number }, b: { x: number; y: number }, cm: number) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const off = -2 * cm * scale
    return { x: (a.x + b.x) / 2 + (-dy / len) * off, y: (a.y + b.y) / 2 + (dx / len) * off }
  }
  const firstGap = o.lines.length > 1 ? R[1].y - R[0].y : 0
  const depth = o.necklineDepth ? Math.min(o.necklineDepth * scale, firstGap * 0.8) : 0

  let d = o.onFold ? `M${fx(left)},${f(R[0].y + depth)}` : `M${fx(L[0].x)},${f(L[0].y)}`
  if (depth) {
    d += o.onFold
      ? ` Q${fx((left + R[0].x) / 2)},${f(R[0].y + depth)} ${fx(R[0].x)},${f(R[0].y)}`
      : ` Q${fx(left)},${f(R[0].y + depth * 2)} ${fx(R[0].x)},${f(R[0].y)}`
  } else d += ` L${fx(R[0].x)},${f(R[0].y)}`
  for (let k = 0; k < o.lines.length - 1; k++) {
    const cm = o.lines[k].curve ?? 0
    if (!cm) d += ` L${fx(R[k + 1].x)},${f(R[k + 1].y)}`
    else {
      const c = control(R[k], R[k + 1], cm)
      d += ` Q${fx(c.x)},${f(c.y)} ${fx(R[k + 1].x)},${f(R[k + 1].y)}`
    }
  }
  const n = o.lines.length - 1
  const sag = (o.hemCurve ?? 0) * scale
  if (!sag) d += ` L${fx(L[n].x)},${f(L[n].y)}`
  // A quadratic sits halfway to its control point, so it goes twice the sag below the edge
  else d += ` Q${fx(o.onFold ? (R[n].x + L[n].x) / 2 : left)},${f(R[n].y + sag * 2)} ${fx(L[n].x)},${f(L[n].y)}`
  if (!o.onFold) {
    for (let k = n - 1; k >= 0; k--) {
      const cm = o.lines[k].curve ?? 0
      if (!cm) d += ` L${fx(L[k].x)},${f(L[k].y)}`
      else {
        const c = control(R[k], R[k + 1], cm)
        d += ` Q${fx(2 * left - c.x)},${f(c.y)} ${fx(L[k].x)},${f(L[k].y)}`
      }
    }
  }
  return d + ' Z'
}

/** Width and height the outline takes up, in cm, including sides that curve out */
export function outlineSize(o: PieceOutline) {
  const bulge = Math.max(0, ...o.lines.map((l) => l.curve ?? 0))
  return { width: Math.max(...o.lines.map((l) => l.width)) + bulge * (o.onFold ? 1 : 2), height: o.lines[o.lines.length - 1].down }
}
