/**
 * The guide's instruction-video scenes: a step played out on a cutting mat in soft 3D, with the
 * real pattern pieces in one plain fabric. Built for any guide from the step alone: its kind
 * (cut, mark, fold, press, pin, sew), its pieces and how they join. The table shows what the
 * sewer really has in front of them: what was sewn earlier stays together, anything not part of
 * the step is put aside (see `assemblyAt`).
 *
 * A scene is a list of beats. Each frame the state is worked out again from the start, every beat
 * applied with its progress, so the scene can loop, pause or jump anywhere exactly.
 */
import { boxOf, layout, lineX, type Placed } from './assembly-layout'
import { isSecondCut, type Assembly } from './assembly'
import { outlineCommands, outlineSize as outlineSizeOf, type OutlineCmd, type PieceOutline } from './piece-outline'
import type { GuidePiece, PieceEdge, SewingStep2D, UserMeasurements } from './types'

/** The animation rules, settled in the Saratoga assembly lab */
export const RULES = {
  /** Overall pace (×) and the pause between moves, ms */
  speed: 1,
  pause: 250,
  /** Pieces come in from this share of the scene away, lifted this many px */
  approach: 35,
  lift: 60,
  /** Right sides together is shown by folding the piece over along the seam edge */
  flip: true,
  /** Curved edges bend while the piece comes in (not once it's arrived) */
  bendWhileComing: true,
  /** Table tilt (°) and how much closer the camera goes on a tool */
  tilt: 30,
  zoom: 1.4,
  /** Pins per seam, stitch length (mm) */
  pins: 5,
  stitch: 3.5,
  /** Pieces sewn earlier fade back while the new ones move */
  dimEarlier: true,
  /** The finished frame holds this long before the scene plays again, ms */
  hold: 1400,
}

export type Pt = [number, number]
type Box4 = [number, number, number, number]

export interface ScenePiece {
  key: string
  o: PieceOutline
  label: string
  x: number
  y: number
  w: number
  h: number
  /** Drawn from this x (cm from its left): the centre line, or the straight edge of a half */
  lineX: number
  layer: number
  side: 'right' | 'wrong'
  /** Paper is the printed pattern laid on the fabric to cut around */
  style: 'fabric' | 'interfacing' | 'paper'
  /** The fabric a piece is cut from: the piece's shape, cut out of it once `holed` */
  hole?: OutlineCmd[]
  /** Not on the table yet: it comes in during the scene */
  enters: boolean
  /** Shows its letter (interfacing ironed onto a piece doesn't) */
  labelled: boolean
}

export interface PieceState {
  key: string
  x: number
  y: number
  ox: number
  oy: number
  z: number
  lift: number
  rot: { axis: 'x' | 'y'; deg: number; o: Pt } | null
  side: 'right' | 'wrong'
  fold: { y: number; part: 'above' | 'below'; deg: number } | null
  op: number
  hem: number
  style: 'fabric' | 'interfacing' | 'paper'
  tint: number
  moving: boolean
  holed: boolean
}
export interface Line { id: string; kind: 'stitch' | 'seam' | 'chalk' | 'cut' | 'fold'; pts: Pt[]; p: number; z: number; op: number; on: string }
export interface Pin { line: string; u: number; x: number; y: number; ang: number; drop: number; out: number; z: number; on: string }
export interface Tool { on: string; kind: 'machine' | 'iron' | 'scissors' | 'chalk'; x: number; y: number; ang: number; z: number; phase: number }
export interface SceneState {
  p: Record<string, PieceState>
  lines: Line[]
  pins: Pin[]
  tool: Tool | null
  cam: { fx: number; fy: number; z: number }
  focus: string[] | null
  frameMax: number
  work: Box4
}
interface Beat {
  base: number
  apply: (st: SceneState, t: number) => void
  focus?: string[]
  cam?: 'wide' | 'pts' | 'tool'
  pts?: Pt[]
}
export interface Scene {
  frame: Box4
  pieces: ScenePiece[]
  beats: Beat[]
  /** Seams sewn in earlier steps */
  seams: Line[]
  starts: number[]
  durs: number[]
  total: number
}

// ---------- easing and paths ----------
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function bez(x1: number, y1: number, x2: number, y2: number) {
  const cb = (u: number, a: number, b: number) => 3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3
  const dcb = (u: number, a: number, b: number) => 3 * a * (1 - u) ** 2 + 6 * (b - a) * u * (1 - u) + 3 * (1 - b) * u * u
  return (t: number) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let u = t
    for (let i = 0; i < 8; i++) {
      const x = cb(u, x1, x2) - t
      const d = dcb(u, x1, x2)
      if (Math.abs(x) < 1e-5 || Math.abs(d) < 1e-6) break
      u = clamp(u - x / d)
    }
    return cb(u, y1, y2)
  }
}
/** Pieces settle softly; tools move evenly in and out */
const move = bez(0.22, 1, 0.36, 1)
const inOut = bez(0.45, 0, 0.55, 1)

export function sampleCmds(cmds: OutlineCmd[], dx = 0, dy = 0): Pt[] {
  const pts: Pt[] = []
  let cur: Pt = [0, 0]
  let start: Pt | null = null
  for (const c of cmds) {
    if (c[0] === 'M' || c[0] === 'L') {
      cur = [c[1], c[2]]
      if (c[0] === 'M') start = cur
      pts.push([cur[0] + dx, cur[1] + dy])
    } else if (c[0] === 'Q') {
      const [, cx, cy, x, y] = c
      for (let i = 1; i <= 16; i++) {
        const t = i / 16
        pts.push([(1 - t) ** 2 * cur[0] + 2 * (1 - t) * t * cx + t * t * x + dx, (1 - t) ** 2 * cur[1] + 2 * (1 - t) * t * cy + t * t * y + dy])
      }
      cur = [x, y]
    } else if (start) pts.push([start[0] + dx, start[1] + dy])
  }
  return pts
}
const quad = (a: Pt, c: Pt, b: Pt, n = 20): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]
  })
function lensOf(pts: Pt[]) {
  const l = [0]
  for (let i = 1; i < pts.length; i++) l.push(l[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return l
}
export function at(pts: Pt[], u: number) {
  const l = lensOf(pts)
  const L = l[l.length - 1] || 1
  const d = clamp(u) * L
  let i = 1
  while (i < l.length - 1 && l[i] < d) i++
  const a = pts[i - 1]
  const b = pts[i] ?? a
  const t = clamp((d - l[i - 1]) / (l[i] - l[i - 1] || 1))
  return { x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t), ang: Math.atan2(b[1] - a[1], b[0] - a[0]), len: L }
}
export function upTo(pts: Pt[], u: number): Pt[] {
  const l = lensOf(pts)
  const d = clamp(u) * l[l.length - 1]
  const out: Pt[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    if (l[i] <= d) out.push(pts[i])
    else {
      const t = (d - l[i - 1]) / (l[i] - l[i - 1] || 1)
      out.push([lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)])
      break
    }
  }
  return out
}
const centreOf = (pts: Pt[]): Pt => {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}

// ---------- beats ----------
function approach(key: string, { dx = 0, dy = -1, bend = 0, liftK = 1, base = 950 }: { dx?: number; dy?: number; bend?: number; liftK?: number; base?: number }): Beat {
  return {
    base,
    focus: [key],
    cam: 'wide',
    apply: (st, t) => {
      const p = st.p[key]
      const e = move(t)
      const dist = (RULES.approach / 100) * 0.55 * st.frameMax
      p.ox = dx * dist * (1 - e)
      p.oy = dy * dist * (1 - e)
      p.lift = RULES.lift * liftK * (1 - inOut(clamp(t * 1.05)))
      p.op = clamp(t * 4)
      p.moving = t < 1
      if (bend) p.hem = RULES.bendWhileComing ? bend * inOut(clamp((t - 0.15) / 0.75)) : bend * clamp((t - 0.9) * 10)
    },
  }
}
function flip(key: string, origin: Pt, from: number, to: number, base = 1200): Beat {
  return {
    base,
    focus: [key],
    apply: (st, t) => {
      const p = st.p[key]
      p.rot = { axis: 'y', deg: lerp(from, to, inOut(t)), o: origin }
      p.lift = Math.sin(Math.PI * t) * RULES.lift * 0.25
      p.moving = t < 1
    },
  }
}
function fold(key: string, hinge: number, part: 'above' | 'below'): Beat {
  return { base: 1200, focus: [key], apply: (st, t) => { const p = st.p[key]; p.fold = { y: hinge, part, deg: (part === 'below' ? 180 : -180) * inOut(t) }; p.moving = t < 1 } }
}
function pins(id: string, pts: Pt[], on: string, top = on): Beat {
  return {
    base: 300 * RULES.pins + 300,
    cam: 'pts',
    pts,
    apply: (st, t) => {
      const n = RULES.pins
      const z = st.p[top].z + 0.7
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n
        const q = at(pts, u)
        const local = clamp((t * 1.1 - (i / n) * 0.8) / 0.28)
        st.pins.push({ line: id, u, x: q.x, y: q.y, ang: q.ang + Math.PI / 2 + 0.22, drop: inOut(local), out: 0, z, on })
      }
    },
  }
}
function sew(id: string, pts: Pt[], on: string, top = on, base = 2000): Beat {
  return {
    base,
    cam: 'tool',
    pts,
    apply: (st, t) => {
      const p = inOut(t)
      const z = st.p[top].z + 0.7 + (st.p[top].fold ? 1 : 0)
      st.lines.push({ id, kind: 'stitch', pts, p, z, op: 1, on })
      for (const pin of st.pins) if (pin.line === id) pin.out = clamp((p - pin.u + 0.04) / 0.07)
      if (t < 1) {
        const q = at(pts, p)
        st.tool = { on, kind: 'machine', x: q.x, y: q.y, ang: q.ang, z: z + 1, phase: (p * q.len) / (RULES.stitch / 10) }
      }
    },
  }
}
function press(pts: Pt[], on: string, during?: (st: SceneState, t: number) => void, base = 1700): Beat {
  return {
    base,
    // an iron is bigger than most pieces: no zooming in on it
    cam: 'wide',
    pts,
    apply: (st, t) => {
      const u = t < 0.5 ? inOut(t * 2) : inOut(2 - t * 2)
      const q = at(pts, u)
      const z = st.p[on].z + 2
      if (t < 1) st.tool = { on, kind: 'iron', x: q.x, y: q.y, ang: at(pts, 0).ang, z: z + 2 * (1 - Math.sin(Math.PI * clamp(t * 1.2))), phase: t * 14 }
      during?.(st, t)
    },
  }
}
function trace(id: string, kind: 'cut' | 'chalk', pts: Pt[], on: string, base: number): Beat {
  return {
    base,
    cam: 'tool',
    pts,
    apply: (st, t) => {
      const p = inOut(t)
      const z = st.p[on].z + 0.7
      st.lines.push({ id, kind, pts, p, z, op: 1, on })
      if (t < 1) {
        const q = at(pts, p)
        st.tool = { on, kind: kind === 'cut' ? 'scissors' : 'chalk', x: q.x, y: q.y, ang: q.ang, z: z + 1, phase: (p * q.len) / 1.4 }
      }
    },
  }
}
const wide = (): Beat => ({ base: 800, cam: 'wide', apply: () => {} })

// ---------- seams, from where pieces meet ----------
const scoopOf = (p: Pick<Placed, 'o' | 'h'>) => {
  const gap = p.o.lines.length > 1 ? p.o.lines[1].down - p.o.lines[0].down : 0
  return p.o.necklineDepth ? Math.min(p.o.necklineDepth, gap * 0.8) : 0
}
/** The neckline (or straight top edge) of a piece, `inset` cm inside it */
function necklineOf(p: Placed, inset = 0): Pt[] {
  const cx = p.x + lineX(p)
  const half = p.o.lines[0].width / (p.o.onFold ? 1 : 2)
  const d = scoopOf(p)
  const x0 = p.o.onFold ? (p.o.mirror ? cx - half : cx) : cx - half
  const x1 = p.o.onFold ? (p.o.mirror ? cx : cx + half) : cx + half
  if (!d || p.o.onFold) return [[x0 + inset, p.y + inset * 0.8], [x1 - inset, p.y + inset * 0.8]]
  return quad([x0 + inset, p.y + inset * 0.8], [cx, p.y + 2 * d + inset], [x1 - inset, p.y + inset * 0.8], 24)
}
/** Along an edge of a piece's box, `inset` cm inside it */
function edgeOf(p: Placed, edge: PieceEdge, inset: number): Pt[] {
  const pad = Math.min(p.w, p.h) * 0.08
  const widthAt = (k: number) => {
    // the outline's half width at k cm down, for slanted sides
    const ls = p.o.lines
    let i = 1
    while (i < ls.length - 1 && ls[i].down < k) i++
    const a = ls[i - 1]
    const b = ls[i]
    const w = a.width + ((b.width - a.width) * (k - a.down)) / (b.down - a.down || 1)
    return w * (p.o.onFold ? 1 : 0.5)
  }
  const cx = p.x + lineX(p)
  if (edge === 'top' || edge === 'bottom') {
    const y = edge === 'top' ? inset : p.h - inset
    const hw = widthAt(y) - pad
    return p.o.onFold ? (p.o.mirror ? [[cx - hw, p.y + y], [cx - pad, p.y + y]] : [[cx + pad, p.y + y], [cx + hw, p.y + y]]) : [[cx - hw, p.y + y], [cx + hw, p.y + y]]
  }
  const sign = edge === 'left' ? -1 : 1
  return [[cx + sign * (widthAt(pad) - inset), p.y + pad], [cx + sign * (widthAt(p.h - pad) - inset), p.y + p.h - pad]]
}
/** Where a joined piece meets the piece it was sewn to */
function seamOf(contact: Placed, to: Placed, group: Placed[], inset: number): Pt[] {
  const via = contact.join?.via ?? 'side'
  if (via === 'side') {
    const top = contact.y + (contact.o.onFold ? scoopOf(contact) : 0)
    return [[contact.x - inset, top + 0.4], [contact.x - inset, contact.y + Math.min(contact.h, to.h) * (contact.o.onFold ? 0.7 : 0.92)]]
  }
  if (via === 'top') return necklineOf(to, inset)
  const g = boxOf(group)
  // A big piece laid on lines up with the neckline: sewn around it. A small one: along its top
  if (Math.abs(g.y - to.y) < 0.5 && scoopOf(to)) return necklineOf(to, inset)
  return [[g.x + Math.min(1.2, g.w * 0.06), g.y + inset], [g.x + g.w - Math.min(1.2, g.w * 0.06), g.y + inset]]
}

// ---------- building a step's scene ----------
/**
 * The scene for one step: the pieces on the table (laid out as they're sewn), and the beats that
 * play the step out by its kind.
 */
export function buildScene(step: Pick<SewingStep2D, 'action' | 'annotation' | 'fabricSide' | 'pieceId' | 'title'>, assembly: Assembly | null, pieces: GuidePiece[], m: UserMeasurements): Scene | null {
  const base = assembly?.base ?? (step.pieceId ? [{ id: step.pieceId }] : [])
  const joining = assembly?.joining ?? []
  const laid = layout([...base, ...joining.flat()], pieces, m)
  if (laid.length === 0) return null
  const joiningIds = new Set(joining.flat().map((m) => m.id))
  const side = step.fabricSide === 'wrong' ? 'wrong' : 'right'
  const scenePieces: ScenePiece[] = laid.map((p, i) => ({
    key: p.id,
    o: p.o,
    label: `${p.piece.label}${isSecondCut(p.id) ? '²' : ''}`,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    lineX: lineX(p),
    layer: i,
    side,
    style: p.piece.material === 'interfacing' ? 'interfacing' : 'fabric',
    enters: joiningIds.has(p.id),
    labelled: !(p.piece.material === 'interfacing' && p.join),
  }))
  const byId = (id: string) => laid.find((p) => p.id === id)
  const box = boxOf(laid)
  const margin = Math.max(box.w, box.h) * 0.06
  const frame: Box4 = [box.x - margin, box.y - margin, box.x + box.w + margin, box.y + box.h + margin]

  // Seams sewn in earlier steps stay on the table
  const seams: Line[] = []
  for (const p of laid) {
    if (!p.join || joiningIds.has(p.id)) continue
    const to = byId(p.join.to)
    if (!to) continue
    const kind = p.piece.material === 'interfacing' ? null : 'seam'
    if (kind) seams.push({ id: `old-${p.id}`, kind, pts: seamOf(p, to, [p], p.join.via === 'side' ? 0 : 0.8), p: 1, z: 0, op: 0.9, on: to.id })
  }

  const beats: Beat[] = []
  const action = step.action
  const group = joining[0] ? laid.filter((p) => joining[0].some((m) => m.id === p.id)) : []
  const contact = group.find((p) => p.join) ?? group[0]

  if (contact) {
    // Pieces joining: they come in, then are pinned and sewn (or ironed on, for interfacing)
    const to = byId(contact.join?.to ?? '') ?? laid[0]
    const via = contact.join?.via ?? 'side'
    const fused = group.every((p) => p.piece.material === 'interfacing')
    const halves = via === 'side' && contact.o.onFold && to.o.onFold
    const topKey = group.reduce((a, p) => (scenePieces.find((s) => s.key === p.id)!.layer > scenePieces.find((s) => s.key === a.id)!.layer ? p : a), group[0]).id
    if (halves && RULES.flip && group.length === 1) {
      // Two halves: side by side, the second folds over the first, sewn, opened out
      const seam = seamOf(contact, to, group, 1.3)
      beats.push(approach(contact.id, { dx: 1, dy: 0, liftK: 0.25 }), flip(contact.id, [0, contact.h / 2], 0, -180))
      if (action !== 'press') beats.push(pins('seam', seam, to.id, contact.id))
      if (action !== 'pin') {
        beats.push(sew('seam', seam, to.id, contact.id), {
          base: 1200,
          focus: [contact.id],
          cam: 'wide',
          apply: (st, t) => {
            const p = st.p[contact.id]
            p.rot = { axis: 'y', deg: lerp(-180, 0, inOut(t)), o: [0, contact.h / 2] }
            p.lift = Math.sin(Math.PI * t) * RULES.lift * 0.25
            p.moving = t < 1
            const l = st.lines.find((l) => l.id === 'seam')
            if (l) {
              l.op = t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2
              if (t >= 0.5) { l.kind = 'seam'; l.pts = seamOf(contact, to, group, 0) }
            }
          },
        })
      }
    } else {
      const from = via === 'side' ? { dx: 1, dy: 0, liftK: 0.4 } : { dx: 0, dy: -1 }
      const bend = via === 'top' ? scoopOf(to) : 0
      beats.push(group.length === 1 ? approach(contact.id, { ...from, bend }) : {
        base: 950,
        focus: group.map((p) => p.id),
        cam: 'wide',
        apply: (st, t) => group.forEach((p) => approach(p.id, { ...from, bend: p.id === contact.id ? bend : 0 }).apply(st, t)),
      })
      const seam = seamOf(contact, to, group, via === 'side' ? 1.3 : 0.9)
      const flat = group.map((p) => p.id)
      if (fused) {
        const mid = to.y + to.h / 2
        beats.push(press([[to.x - to.w * 0.05, mid], [to.x + to.w * 1.05, mid]], to.id, (st, t) => {
          for (const k of flat) st.p[k].op = 1 - 0.65 * clamp((t - 0.35) / 0.5)
          st.p[to.id].tint = clamp((t - 0.2) / 0.6)
        }))
      } else {
        if (action !== 'press') beats.push(pins('seam', seam, to.id, topKey))
        if (action === 'press') beats.push(press(seam, to.id))
        else if (action !== 'pin') beats.push(sew('seam', seam, to.id, topKey))
      }
    }
  } else {
    // One piece (or a set already sewn): the step's action on its piece
    const target = byId(step.pieceId ?? '') ?? laid.find((p) => p.id === base[0]?.id) ?? laid[0]
    const hem = /\bhem/i.test(step.title ?? '')
    const edge: PieceEdge = step.annotation?.edge ?? 'bottom'
    // Sewing, pressing or pinning a set right after it was joined: it's that seam (a step that
    // only pins the pieces is often followed by one that sews them, then one that presses it).
    // The latest join is the last group attached to the set.
    let root: (typeof base)[number] | undefined
    for (let i = 1; i < base.length; i += Math.max(1, base[i].n ?? 1)) if (base[i].via) root = base[i]
    const last = root ? byId(root.contact ?? root.id) : undefined
    const lastTo = last?.join ? byId(last.join.to) : undefined
    const onSeam = !hem && !step.annotation?.edge && assembly?.recentJoin && last && lastTo && last.piece.material !== 'interfacing' && ['sew', 'attach', 'press', 'pin'].includes(action)
    if (onSeam) {
      const seam = seamOf(last, lastTo, [last], last.join?.via === 'side' ? 0.4 : 0.9)
      const i = seams.findIndex((l) => l.id === `old-${last.id}`)
      if (i >= 0 && action !== 'press') seams.splice(i, 1)
      if (action === 'pin') beats.push(pins('seam', seam, lastTo.id, last.id))
      else if (action === 'press') beats.push(press(seam, lastTo.id))
      else beats.push(sew('seam', seam, lastTo.id, last.id))
    } else if (action === 'cut' && laid.length === 1) {
      // The whole fabric, with the pattern laid in its corner so the rest stays whole for the
      // next pieces. A piece cut on the fold goes against the fold of folded fabric. Cut around,
      // the piece lifts out (and unfolds) and is put aside, leaving its shape in the fabric.
      const half = target.piece.outline?.onFold ? { ...target.piece.outline, onFold: true, mirror: false } : null
      const o = half ?? target.o
      const w = half ? outlineSizeOf(half).width : target.w
      const lx = half ? 0 : lineX(target)
      const m = half ? 0 : 2
      const fw = half ? Math.max(70, w + 14) : Math.max(140, w + 24)
      const fh = target.h + Math.max(24, target.h * 0.55)
      const x0 = 0
      const y0 = 0
      const cutKey = target.id
      const shape = outlineCommands(o, lx).map(([k, ...v]) => [k, ...v.map((n, i) => n + (i % 2 === 0 ? m : 2))] as OutlineCmd)
      const piece: ScenePiece = { key: cutKey, o, label: target.piece.label, x: x0 + m, y: y0 + 2, w, h: target.h, lineX: lx, layer: 1, side, style: 'fabric', enters: true, labelled: true }
      scenePieces.splice(0, scenePieces.length,
        { key: '_fabric', o: { lines: [{ down: 0, width: fw }, { down: fh, width: fw }] }, label: '', x: x0, y: y0, w: fw, h: fh, lineX: fw / 2, layer: 0, side: 'right', style: 'fabric', hole: shape, enters: false, labelled: false },
        piece,
        ...(half ? [{ ...piece, key: '_open', layer: 1.5 }] : []),
        { ...piece, key: '_paper', layer: 2, style: 'paper', enters: true, labelled: false },
      )
      frame[0] = x0 - (half ? w + 4 : 4)
      frame[1] = y0 - 4
      frame[2] = x0 + fw + 4
      frame[3] = y0 + fh + 4
      if (half) seams.push({ id: 'fold', kind: 'fold', pts: [[x0 + 0.3, y0 + 0.6], [x0 + 0.3, y0 + fh - 0.6]], p: 1, z: 0, op: 1, on: '_fabric' })
      const edge = sampleCmds(outlineCommands(o, lx), piece.x, piece.y)
      beats.push(approach('_paper', { dy: -0.6 }), trace('cut', 'cut', half ? edge.filter((q) => q[0] > x0 + 0.2) : edge, '_paper', 3200), {
        base: 1300,
        focus: [cutKey, '_open'],
        cam: 'wide',
        apply: (st, t) => {
          const e = inOut(t)
          st.p._paper.lift = 90 * e
          st.p._paper.op = 1 - e
          const l = st.lines.find((l) => l.id === 'cut')
          if (l) l.op = 1 - e
          st.p._fabric.holed = true
          for (const k of [cutKey, ...(half ? ['_open'] : [])]) {
            const p = st.p[k]
            p.op = 1
            p.lift = RULES.lift * 0.5 * e
            p.moving = t < 1
          }
          // cut on the fold: the second layer opens out along the fold
          if (half) st.p._open.rot = { axis: 'y', deg: -180 * clamp((t - 0.25) / 0.75), o: [0, target.h / 2] }
        },
      }, {
        base: 900,
        cam: 'wide',
        apply: (st, t) => {
          const e = inOut(t)
          for (const k of [cutKey, ...(half ? ['_open'] : [])]) {
            const p = st.p[k]
            p.lift = RULES.lift * (0.5 + 1.5 * e)
            p.op = 1 - e
            p.moving = t < 1
          }
        },
      })
    } else if (action === 'cut') beats.push(trace('cut', 'cut', sampleCmds(outlineCommands(target.o, lineX(target)), target.x, target.y), target.id, 3200))
    else if (action === 'mark') {
      const y = target.y + target.h * 0.55
      const hw = Math.min(9, target.w * 0.3)
      const cx = target.x + lineX(target) + (target.o.onFold ? hw * 1.2 : 0)
      beats.push(trace('mark', 'chalk', [[cx - hw, y], [cx + hw, y]], target.id, 1500))
    } else if (action === 'fold' && (edge === 'top' || edge === 'bottom')) {
      const amount = clamp(step.annotation?.amount ?? 2.5, 0.5, target.h * 0.25)
      const hinge = edge === 'bottom' ? target.h - amount : amount
      beats.push(fold(target.id, hinge, edge === 'bottom' ? 'below' : 'above'))
      beats.push(press(edgeOf(target, edge, amount * 0.6), target.id))
    } else if (action === 'press' || action === 'fold') beats.push(press(edgeOf(target, edge, Math.min(2, target.h * 0.15)), target.id))
    else if (action === 'pin') beats.push(pins('pin', edgeOf(target, edge, 1.3), target.id))
    else if (action === 'sew' || action === 'attach') {
      const line = edgeOf(target, edge, Math.min(1.5, target.h * 0.12))
      beats.push(pins('sew', line, target.id), sew('sew', line, target.id))
    }
  }
  if (beats.length) beats.push(wide())

  const starts: number[] = []
  const durs: number[] = []
  let t = 0
  for (const b of beats) {
    const d = b.base / RULES.speed
    starts.push(t)
    durs.push(d)
    t += d + RULES.pause
  }
  return { frame, pieces: scenePieces, beats, seams, starts, durs, total: Math.max(1, t - RULES.pause + 300) }
}

/** The scene's state at a moment, in ms from the start */
export function stateAt(scene: Scene, time: number): SceneState {
  const [x0, y0, x1, y1] = scene.frame
  const p: Record<string, PieceState> = {}
  for (const sp of scene.pieces) {
    p[sp.key] = { key: sp.key, x: sp.x, y: sp.y, ox: 0, oy: 0, z: 1 + sp.layer * 1.6, lift: 0, rot: null, side: sp.side, fold: null, op: sp.enters ? 0 : 1, hem: 0, style: sp.style, tint: 0, moving: false, holed: false }
  }
  const st: SceneState = { p, lines: scene.seams.map((l) => ({ ...l, z: (p[l.on]?.z ?? 1) + 0.6 })), pins: [], tool: null, cam: { fx: (x0 + x1) / 2, fy: (y0 + y1) / 2, z: 1 }, focus: null, frameMax: Math.max(x1 - x0, y1 - y0), work: scene.frame }
  for (let i = 0; i < scene.beats.length; i++) {
    if (time < scene.starts[i]) break
    const b = scene.beats[i]
    const t = clamp((time - scene.starts[i]) / scene.durs[i])
    const camStart = { ...st.cam }
    st.tool = null
    b.apply(st, t)
    st.focus = t < 1 ? (b.focus ?? null) : null
    const [w0, v0, w1, v1] = st.work
    const fit = Math.max(1, Math.min((x1 - x0) / (w1 - w0), (y1 - y0) / (v1 - v0)) * 0.92)
    const k = inOut(clamp(t / 0.3))
    const zIn = fit * RULES.zoom
    if (b.cam === 'wide') st.cam = { fx: lerp(camStart.fx, (w0 + w1) / 2, k), fy: lerp(camStart.fy, (v0 + v1) / 2, k), z: lerp(camStart.z, fit, k) }
    else if (b.cam === 'pts' && b.pts) {
      const [cx, cy] = centreOf(b.pts)
      st.cam = { fx: lerp(camStart.fx, cx, k), fy: lerp(camStart.fy, cy, k), z: lerp(camStart.z, zIn, k) }
    } else if (b.cam === 'tool') {
      // set by the beat just applied
      const tool = st.tool as Tool | null
      const tx = tool ? tool.x : camStart.fx
      const ty = tool ? tool.y : camStart.fy
      st.cam = { fx: lerp(camStart.fx, tx, k), fy: lerp(camStart.fy, ty, k), z: lerp(camStart.z, zIn, k) }
    }
  }
  return st
}
