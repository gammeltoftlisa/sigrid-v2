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

/** One step of an outline, in cm: move, line, quadratic curve (control, end), or close */
export type OutlineCmd = ['M', number, number] | ['L', number, number] | ['Q', number, number, number, number] | ['Z']

/**
 * The outline as drawing steps in cm, with `left` as the centre line (or the fold) and the top
 * line at 0. Shared by the SVG path below and the guide's 3D scene.
 */
export function outlineCommands(o: PieceOutline, left = 0): OutlineCmd[] {
  const xL = (w: number) => (o.onFold ? left : left - w / 2)
  const xR = (w: number) => (o.onFold ? left + w : left + w / 2)
  const R = o.lines.map((l) => ({ x: xR(l.width), y: l.down }))
  const L = o.lines.map((l) => ({ x: xL(l.width), y: l.down }))
  // A quadratic bows half as far as its control point, so it sits twice the curve away
  const control = (a: { x: number; y: number }, b: { x: number; y: number }, cm: number) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const off = -2 * cm
    return { x: (a.x + b.x) / 2 + (-dy / len) * off, y: (a.y + b.y) / 2 + (dx / len) * off }
  }
  const firstGap = o.lines.length > 1 ? R[1].y - R[0].y : 0
  const depth = o.necklineDepth ? Math.min(o.necklineDepth, firstGap * 0.8) : 0

  const c: OutlineCmd[] = [o.onFold ? ['M', left, R[0].y + depth] : ['M', L[0].x, L[0].y]]
  if (depth) c.push(o.onFold ? ['Q', (left + R[0].x) / 2, R[0].y + depth, R[0].x, R[0].y] : ['Q', left, R[0].y + depth * 2, R[0].x, R[0].y])
  else c.push(['L', R[0].x, R[0].y])
  for (let k = 0; k < o.lines.length - 1; k++) {
    const cm = o.lines[k].curve ?? 0
    if (!cm) c.push(['L', R[k + 1].x, R[k + 1].y])
    else {
      const q = control(R[k], R[k + 1], cm)
      c.push(['Q', q.x, q.y, R[k + 1].x, R[k + 1].y])
    }
  }
  const n = o.lines.length - 1
  const sag = o.hemCurve ?? 0
  if (!sag) c.push(['L', L[n].x, L[n].y])
  // A quadratic sits halfway to its control point, so it goes twice the sag below the edge
  else c.push(['Q', o.onFold ? (R[n].x + L[n].x) / 2 : left, R[n].y + sag * 2, L[n].x, L[n].y])
  if (!o.onFold) {
    for (let k = n - 1; k >= 0; k--) {
      const cm = o.lines[k].curve ?? 0
      if (!cm) c.push(['L', L[k].x, L[k].y])
      else {
        const q = control(R[k], R[k + 1], cm)
        c.push(['Q', 2 * left - q.x, q.y, L[k].x, L[k].y])
      }
    }
  }
  c.push(['Z'])
  // A mirrored half: flipped about the fold
  if (o.onFold && o.mirror) return c.map(([k, ...v]) => [k, ...v.map((n, i) => (i % 2 === 0 ? 2 * left - n : n))] as OutlineCmd)
  return c
}

/** Drawing steps as an SVG path: cm scaled by `scale`, moved by `x`, `y`, optionally flipped across `flipW` px */
export function commandsToPath(cmds: OutlineCmd[], { x = 0, y = 0, scale = 1, flipW }: { x?: number; y?: number; scale?: number; flipW?: number }): string {
  const f = (n: number) => n.toFixed(1)
  const X = (n: number) => f(flipW != null ? flipW - (x + n * scale) : x + n * scale)
  const Y = (n: number) => f(y + n * scale)
  return cmds
    .map(([k, ...v]) => (k === 'Z' ? 'Z' : `${k}${v.map((n, i) => (i % 2 === 0 ? X(n) : Y(n))).join(',')}`))
    .join(' ')
}

/**
 * The outline as an SVG path. `left` is the centre line (or the fold), `top` the y of the top
 * line, `scale` px per cm. Shared by the studio drawing and the sewer's guide so both show the
 * same shape.
 */
export function outlinePath(o: PieceOutline, { left, top, scale }: { left: number; top: number; scale: number }): string {
  return commandsToPath(outlineCommands(o, 0), { x: left, y: top, scale })
}

/** Width and height the outline takes up, in cm, including sides that curve out */
export function outlineSize(o: PieceOutline) {
  const bulge = Math.max(0, ...o.lines.map((l) => l.curve ?? 0))
  return { width: Math.max(...o.lines.map((l) => l.width)) + bulge * (o.onFold ? 1 : 2), height: o.lines[o.lines.length - 1].down }
}
