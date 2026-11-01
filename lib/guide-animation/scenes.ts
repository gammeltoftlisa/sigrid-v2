/**
 * Turns a plan from ./rules.ts into a scene. Every scene is what you do, the whole way along, and
 * then the result. What earlier steps did stays on the cloth: folds and stitches carry through every
 * later step (`leavesOf`).
 */
import { assemblyAt } from '@/lib/assembly'
import { outlineOf } from '@/lib/assembly-layout'
import { RULES, approach, at, buildScene, clamp, gentle, inOut, press, sampleCmds, sew, trace, wide as wideBeat, type Band, type Beat, type LineKind, type Pt, type Scene, type ScenePiece, type SceneState } from '@/lib/guide-scene'
import { outlineCommands, outlineSize, type OutlineCmd, type PieceOutline } from '@/lib/piece-outline'
import type { GuidePiece, PieceEdge, SewingStep2D, UserMeasurements } from '@/lib/types'
import { planStep, type CutMode, type Plan } from './rules'

const wide = (): Beat => ({ ...wideBeat(), name: 'Result', base: 1100 })

// ---------- lines on a piece ----------
/** A piece's real edge, in scene centimetres: top to bottom, or across for the top and bottom */
function edgeLine(sp: ScenePiece, edge: PieceEdge): Pt[] {
  const pts = sampleCmds(outlineCommands({ ...sp.o, hemCurve: 0 }, sp.lineX), sp.x, sp.y)
  const bottom = sp.y + sp.h
  const cx = sp.x + sp.lineX
  const near = (a: number, b: number) => Math.abs(a - b) < 0.01
  const tops = pts.map((q, i) => (near(q[1], sp.y) ? i : -1)).filter((i) => i >= 0)
  const lows = pts.map((q, i) => (near(q[1], bottom) ? i : -1)).filter((i) => i >= 0)
  if (edge === 'bottom') return [pts[lows[0]], pts[lows[lows.length - 1]]]
  if (edge === 'top') return [pts[tops[0]], pts[sp.o.onFold ? tops[0] : tops[1]]]
  // Whole pieces start at the top left, then the neckline to the top right. Halves start on the fold.
  const topRight = sp.o.onFold ? tops[0] : tops[1]
  const right = pts.slice(topRight, lows[0] + 1)
  if (sp.o.onFold || edge === 'right') return right
  const left = pts.slice(lows[lows.length - 1]).filter((q, i, all) => q[0] <= cx + 0.01 && (i === 0 || q[0] !== all[i - 1][0] || q[1] !== all[i - 1][1]))
  return left.reverse()
}
const middleOf = (sp: ScenePiece): Pt => [sp.x + sp.w / 2, sp.y + sp.h * 0.45]
const toLocal = (sp: ScenePiece, line: Pt[]): Pt[] => line.map(([x, y]) => [x - sp.x, y - sp.y])
/** The middle of a raw edge, in the piece's own cm: where a fold's cloth comes from */
const edgeMiddle = (sp: ScenePiece, edge: PieceEdge): Pt => {
  const q = at(edgeLine(sp, edge), 0.5)
  return [q.x - sp.x, q.y - sp.y]
}
const lenOf = (line: Pt[]) => at(line, 1).len

/** The same line `d` cm further into the piece */
function inset(line: Pt[], d: number, into: Pt): Pt[] {
  const mid = Math.floor(line.length / 2)
  const normal = (i: number): Pt => {
    const a = line[Math.max(0, i - 1)]
    const b = line[Math.min(line.length - 1, i + 1)]
    const l = Math.hypot(b[1] - a[1], b[0] - a[0]) || 1
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]
  }
  const m = normal(mid)
  const flip = (into[0] - line[mid][0]) * m[0] + (into[1] - line[mid][1]) * m[1] < 0 ? -1 : 1
  return line.map((q, i) => {
    const [nx, ny] = normal(i)
    return [q[0] + nx * flip * d, q[1] + ny * flip * d] as Pt
  })
}

/** Only the part of a line that's on the cloth: a fold or a stitch never runs past the piece's edge */
function onCloth(sp: ScenePiece, line: Pt[], margin = 0.25): Pt[] {
  const poly = sampleCmds(outlineCommands({ ...sp.o, hemCurve: 0 }, sp.lineX), sp.x, sp.y)
  const inside = (x: number, y: number) => {
    let c = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]
      const [xj, yj] = poly[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) c = !c
    }
    return c
  }
  const L = lenOf(line) || 1
  const n = Math.min(240, Math.ceil(L / 0.25))
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const q = at(line, i / n)
    const a = at(line, Math.max(0, i / n - margin / L))
    const b = at(line, Math.min(1, i / n + margin / L))
    if (inside(q.x, q.y) && inside(a.x, a.y) && inside(b.x, b.y)) pts.push([q.x, q.y])
  }
  const thin = pts.filter((_, i) => i % 6 === 0 || i === pts.length - 1)
  return thin.length >= 2 ? thin : line
}

/** How close to go for something this wide, so it reads without losing the whole line */
const zoomFor = (s: Scene, width: number) => {
  const frameW = Math.max(s.frame[2] - s.frame[0], (s.frame[3] - s.frame[1]) * 1.6)
  return clamp(26 / (width * (700 / frameW)), 1, 3.6)
}

// ---------- the routines: always the full length, camera following ----------
function foldAlong(s: Scene, sp: ScenePiece, edge: PieceEdge, offset: number, width: number): Beat {
  const hinge = onCloth(sp, inset(edgeLine(sp, edge), offset + width, middleOf(sp)), 0)
  const band: Band = { id: `${edge}-${offset}`, edge, hinge: toLocal(sp, hinge), toward: edgeMiddle(sp, edge), S: width, t: 0, over: true, sweep: true }
  return {
    name: 'Fold',
    base: Math.max(2500, (lenOf(hinge) / 24) * 1000),
    zoom: zoomFor(s, width),
    camAt: (t) => {
      const q = at(hinge, clamp(t * 1.25 - 0.1))
      return [q.x, q.y]
    },
    apply: (st, t) => {
      const p = st.p[sp.key]
      if (!p) return
      p.bands = [...(p.bands ?? []).filter((b) => b.id !== band.id), { ...band, t }]
    },
  }
}

function ironAlong(s: Scene, sp: ScenePiece, edge: PieceEdge, offset: number, width: number): Beat {
  return { ...press(onCloth(sp, inset(edgeLine(sp, edge), offset + width, middleOf(sp))), sp.key), zoom: zoomFor(s, width) }
}

/** Pins evenly along the whole line, placed one after another with the camera following */
function pinAlong(s: Scene, id: string, line: Pt[], key: string, width = 3): Beat {
  const n = Math.round(clamp(lenOf(line) / 9, 3, 14))
  const poses = Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n
    const q = at(line, u)
    return { u, x: q.x, y: q.y, ang: q.ang + Math.PI / 2 }
  })
  return {
    name: 'Pin',
    base: n * 300 + 500,
    zoom: zoomFor(s, width),
    camAt: (t) => {
      const q = at(line, clamp(t * 1.1))
      return [q.x, q.y]
    },
    apply: (st, t) => {
      if (!st.p[key]) return
      const z = st.p[key].z + 0.7
      poses.forEach((q, i) => st.pins.push({ line: id, u: q.u, x: q.x, y: q.y, ang: q.ang, drop: gentle(clamp((t * (n + 1) - i) / 1.5)), out: 0, z, on: key }))
    },
  }
}

/** Sewing a given stitch, by machine or by hand */
function sewAlong(s: Scene, id: string, line: Pt[], key: string, kind: LineKind, width: number, hand = false): Beat {
  const beat = sew(id, line, key)
  return {
    ...beat,
    name: hand ? 'Sew by hand' : 'Sew',
    cam: 'tool',
    zoom: zoomFor(s, width),
    apply: (st, t) => {
      beat.apply(st, t)
      for (const l of st.lines) if (l.id === id) l.kind = kind
      if (hand && st.tool) {
        st.tool.kind = 'hand'
        st.tool.ang = -0.7
      }
    },
  }
}

function retime(scene: Scene) {
  const starts: number[] = []
  const durs: number[] = []
  let t = 0
  for (const b of scene.beats) {
    const d = b.base / RULES.speed
    starts.push(t)
    durs.push(d)
    t += d + (b.base === 1 ? 0 : RULES.pause)
  }
  scene.starts = starts
  scene.durs = durs
  scene.total = Math.max(1, t - RULES.pause + 300)
  return scene
}

// ---------- what earlier steps left on the cloth ----------
interface Left {
  pieceId: string
  fold?: { edge: PieceEdge; width: number }
  stitch?: { edge: PieceEdge; inset: number; kind: LineKind; afterFold: boolean }
  points?: { edge: PieceEdge; count: number; kind: 'chalk' | 'button' }
  dart?: PieceEdge
}

const halfOf = (o: PieceOutline) => ({ ...o, onFold: true, mirror: false, lines: o.lines.map((l) => ({ ...l, width: l.width / 2 })) })

function foldedWidth(left: Left[], pieceId: string, edge: PieceEdge) {
  return left.filter((l) => l.pieceId === pieceId && l.fold?.edge === edge).reduce((sum, l) => sum + (l.fold?.width ?? 0), 0)
}
const lastFoldWidth = (left: Left[], pieceId: string, edge: PieceEdge) => {
  const list = left.filter((l) => l.pieceId === pieceId && l.fold?.edge === edge)
  return list.length ? (list[list.length - 1].fold?.width ?? 0) : 0
}

/** Where a seam goes: on the fold's inner edge if the edge is folded, else its distance from the edge */
function sewInset(left: Left[], pieceId: string, edge: PieceEdge, plan: Extract<Plan, { kind: 'sew' }>) {
  const total = foldedWidth(left, pieceId, edge)
  if (total > 0) return total + lastFoldWidth(left, pieceId, edge) - (plan.close ? 0.3 : plan.inset)
  return plan.inset
}

/** What one step leaves behind, once done */
function leavesOf(plan: Plan, step: SewingStep2D, sofar: Left[], halfSize: (pieceId: string, edge: PieceEdge) => number): Left[] {
  const pieceId = step.pieceId
  if (!pieceId) return []
  if (plan.kind === 'fold') {
    return plan.edges.flatMap((edge) => (plan.widths.length ? plan.widths : [halfSize(pieceId, edge)]).map((width) => ({ pieceId, fold: { edge, width } })))
  }
  if (plan.kind === 'sew' && plan.edges) return plan.edges.map((edge) => ({ pieceId, stitch: { edge, inset: sewInset(sofar, pieceId, edge, plan), kind: plan.stitch, afterFold: foldedWidth(sofar, pieceId, edge) > 0 } }))
  if (plan.kind === 'marks') return [{ pieceId, points: { edge: plan.edge, count: plan.count, kind: 'chalk' } }]
  if (plan.kind === 'buttons') return [{ pieceId, points: { edge: plan.edge, count: plan.count, kind: 'button' } }]
  if (plan.kind === 'dart') return [{ pieceId, dart: plan.edge }]
  return []
}

const pointsAlong = (sp: ScenePiece, edge: PieceEdge, count: number): Pt[] => {
  const line = onCloth(sp, inset(edgeLine(sp, edge), 2.5, middleOf(sp)), 1)
  return Array.from({ length: count }, (_, i) => {
    const q = at(line, (i + 0.5) / count)
    return [q.x, q.y] as Pt
  })
}
const dartLine = (sp: ScenePiece, edge: PieceEdge): Pt[] => {
  const a = at(edgeLine(sp, edge), 0.42)
  const toward = middleOf(sp)
  const d = Math.min(9, sp.w * 0.32)
  const l = Math.hypot(toward[0] - a.x, toward[1] - a.y) || 1
  return [[a.x, a.y], [a.x + ((toward[0] - a.x) / l) * d, a.y + ((toward[1] - a.y) / l) * d]]
}

/** The first moment of every scene: everything that's already been done, on the cloth */
function memory(scene: Scene, left: Left[], wrongUp: boolean): Beat {
  const bands = new Map<string, Band[]>()
  const lines: { key: string; kind: LineKind; pts: Pt[] }[] = []
  for (const l of left) {
    for (const sp of scene.pieces.filter((p) => p.key === l.pieceId || p.key.startsWith(`${l.pieceId}#`))) {
      const c = middleOf(sp)
      if (l.fold) {
        const list = bands.get(sp.key) ?? []
        const before = list.filter((b) => b.edge === l.fold?.edge).reduce((sum, b) => sum + b.S, 0)
        const hinge = onCloth(sp, inset(edgeLine(sp, l.fold.edge), before + l.fold.width, c), 0)
        list.push({ id: `${l.fold.edge}-${before}`, edge: l.fold.edge, hinge: toLocal(sp, hinge), toward: edgeMiddle(sp, l.fold.edge), S: l.fold.width, t: 1, over: wrongUp })
        bands.set(sp.key, list)
        if (!wrongUp) lines.push({ key: sp.key, kind: 'seam-edge', pts: hinge })
      }
      if (l.stitch) lines.push({ key: sp.key, kind: l.stitch.kind, pts: onCloth(sp, inset(edgeLine(sp, l.stitch.edge), l.stitch.inset, c), 0.6) })
      if (l.dart) lines.push({ key: sp.key, kind: 'stitch', pts: dartLine(sp, l.dart) })
      if (l.points) for (const q of pointsAlong(sp, l.points.edge, l.points.count)) lines.push({ key: sp.key, kind: l.points.kind, pts: l.points.kind === 'button' ? [q, q] : [[q[0] - 0.9, q[1]], [q[0] + 0.9, q[1]]] })
    }
  }
  return {
    base: 1,
    apply: (st) => {
      for (const [k, list] of bands) if (st.p[k]) st.p[k].bands = list.map((b) => ({ ...b }))
      lines.forEach((l, i) => {
        if (st.p[l.key]) st.lines.push({ id: `done-${i}`, kind: l.kind, pts: l.pts, p: 1, z: st.p[l.key].z + 0.6, op: 1, on: l.key })
      })
    },
  }
}

// ---------- cutting ----------
/**
 * The line to draw and cut. The pattern sits exactly in the corner, so any side lying on the fabric's
 * own edge is already there: it isn't drawn or cut. The line starts where the pattern leaves that edge.
 * On the fold, the fold is never cut either.
 */
export function cutLine(loop: Pt[], mode: CutMode, fabricWidth: number): Pt[] {
  const near = (a: number, b: number) => Math.abs(a - b) < 0.01
  const onEdge = (a: Pt, b: Pt) => (near(a[1], 0) && near(b[1], 0)) || (near(a[0], fabricWidth) && near(b[0], fabricWidth)) || (mode === 'single' && near(a[0], 0) && near(b[0], 0))
  const open = loop.slice(0, -1)
  if (mode === 'fold') {
    let from = 0
    while (from < open.length - 1 && onEdge(open[from], open[from + 1])) from++
    return open.slice(from)
  }
  const n = open.length
  const segmentOnEdge = (i: number) => onEdge(open[i], open[(i + 1) % n])
  // Start just after the sides on the fabric's edge, and stop where they begin again
  let start = -1
  for (let i = 0; i < n; i++) if (segmentOnEdge(i) && !segmentOnEdge((i + 1) % n)) start = (i + 1) % n
  if (start < 0) return [...open, open[0]]
  const out: Pt[] = [open[start]]
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n
    if (segmentOnEdge(i)) break
    out.push(open[(i + 1) % n])
  }
  return out
}

/**
 * Cutting, always the same steps: fold if needed, lay the pattern in a corner, draw round it, take
 * the pattern away, cut on the line, the fabric goes, the named pieces are left. Where the pattern
 * goes decides what you get:
 * - fold: its straight edge on the fold, which is never cut. It opens into one joined piece, the
 *   same on both sides.
 * - pair: in the corner away from the fold, cut right round both layers: two loose pieces.
 * - single: one layer, no fold, a full pattern in a corner: one piece.
 * Whichever it is, the pattern touches the fabric's edges, so nothing is cut twice or for nothing.
 */
function cutScene(piece: GuidePiece, m: UserMeasurements, plan: Extract<Plan, { kind: 'cut' }>): Scene {
  const outline = outlineOf(piece, m)
  const mode = plan.mode
  const o0: PieceOutline = mode === 'fold' ? (outline.onFold ? outline : halfOf(outline)) : outline.onFold ? { ...outline, onFold: false, lines: outline.lines.map((l) => ({ ...l, width: l.width * 2 })) } : outline
  const style = piece.material === 'interfacing' ? 'interfacing' : 'fabric'
  const q = plan.quantity
  const { width: w, height: h } = outlineSize(o0)
  const lx = o0.onFold ? 0 : w / 2
  // A long length of cloth, wider than it's tall: the pattern takes one corner, the rest stays whole
  const fh = Math.max(h * 1.5, h + 8)
  const fw = Math.max(w * 1.7, fh * 1.45)
  // Exactly in the corner: on the fold, or in the corner furthest from it, or any corner of one layer
  const x0 = mode === 'pair' ? fw - w : 0
  const y0 = 0
  const folded = mode !== 'single'
  const loop = sampleCmds(outlineCommands(o0, lx), x0, y0)
  const line = cutLine(loop, mode, fw)
  const cmds = outlineCommands(o0, lx).map(([k, ...v]) => [k, ...v.map((n, i) => n + (i % 2 === 0 ? x0 : y0))] as OutlineCmd)
  const mirrored = cmds.map(([k, ...v]) => [k, ...v.map((n, i) => (i % 2 === 0 ? fw - n : n))] as OutlineCmd)
  const cloth = (key: string, x: number, layer: number, hole: OutlineCmd[]): ScenePiece => ({ key, o: { lines: [{ down: 0, width: fw }, { down: fh, width: fw }] }, label: '', x, y: 0, w: fw, h: fh, lineX: fw / 2, layer, side: 'right', style: 'fabric', hole, enters: false, labelled: false })
  const name = (n: number) => (q > 1 ? `${piece.label}${n}` : piece.label)
  const first: ScenePiece = { key: 'cut1', o: o0, label: name(mode === 'pair' ? 2 : 1), x: x0, y: y0, w, h, lineX: lx, layer: 1, side: 'right', style, enters: true, labelled: mode !== 'fold' }
  const second: ScenePiece = { ...first, key: 'cut2', layer: 2.4, side: 'wrong', label: name(1), labelled: true, ...(mode === 'fold' ? { labelX: 0, flush: true } : {}) }
  const paper: ScenePiece = { ...first, key: '_paper', layer: 3, style: 'paper', labelled: false, label: piece.label }
  const gap = Math.max(5, w * 0.14)
  const perPass = mode === 'pair' ? 2 : 1
  const whole = mode === 'fold' ? { ...o0, onFold: false, lines: o0.lines.map((l) => ({ ...l, width: l.width * 2 })) } : o0
  const row = mode === 'fold' ? w * 2 : w
  const extras: ScenePiece[] = []
  const end = x0 + w
  let cursor = end + gap
  for (let n = perPass + 1; n <= q; n++) {
    extras.push({ key: `extra${n}`, o: whole, label: name(n), x: cursor, y: y0, w: row, h, lineX: row / 2, layer: 1, side: 'right', style, enters: true, labelled: true })
    cursor += row + gap
  }
  const left = mode === 'single' ? x0 : mode === 'fold' ? x0 - w : x0 - w - gap
  const right = extras.length ? cursor - gap : end
  const pad = Math.max(6, (right - left) * 0.1)
  const result: [number, number, number, number] = [left - pad, y0 - pad, right + pad, y0 + h + pad]
  const sheet: [number, number, number, number] = [-3, -3, fw + 3, fh + 3]
  const flat: [number, number, number, number] = folded ? [-fw - 3, -3, fw + 3, fh + 3] : sheet
  const surface = folded ? '_flap' : '_fabric'
  const scene: Scene = {
    frame: [Math.min(flat[0], result[0]), Math.min(flat[1], result[1]), Math.max(flat[2], result[2]), Math.max(flat[3], result[3])],
    pieces: [cloth('_fabric', 0, 0, cmds), first, ...(folded ? [cloth('_flap', -fw, 1.8, mirrored)] : []), ...(mode === 'single' ? [] : [second]), paper, ...extras],
    beats: [],
    seams: folded ? [{ id: 'fold', kind: 'fold', pts: [[0.3, 0.6], [0.3, fh - 0.6]], p: 1, z: 0, op: 1, on: '_fabric' }] : [],
    starts: [],
    durs: [],
    total: 1,
  }
  const framed = (st: SceneState, box: [number, number, number, number]) => { st.work = box }
  // The line lies on the top layer, in the table's coordinates: that layer has been turned over, and
  // anything drawn in its own frame would be mirrored off to the side
  const onTop = (beat: Beat, id: string, label: string): Beat => ({
    ...beat,
    name: label,
    zoom: 1,
    apply: (st, t) => {
      beat.apply(st, t)
      const top = st.p[surface].z + 0.7
      for (const l of st.lines) if (l.id === id) l.z = top
      if (st.tool) st.tool.z = top + 1
    },
  })
  const fold: Beat = { name: 'Fold', base: RULES.foldTime, focus: ['_flap'], cam: 'wide', apply: (st, t) => { framed(st, flat); const p = st.p._flap; p.rot = { axis: 'y', deg: 180 * gentle(t), o: [fw, fh / 2] }; p.moving = t < 1 } }
  const lay: Beat = { name: mode === 'fold' ? 'Pattern on the fold' : 'Pattern in the corner', base: 1300, cam: 'wide', apply: (st, t) => { framed(st, sheet); const p = st.p._paper; const e = inOut(t); p.op = clamp(t * 4); p.lift = 40 * (1 - e); p.oy = -fh * 0.1 * (1 - e) } }
  const lift: Beat = { name: 'Pattern off', base: 1000, cam: 'wide', apply: (st, t) => { framed(st, sheet); const e = gentle(t); st.p._paper.lift = 60 * e; st.p._paper.op = 1 - e } }
  const beats: Beat[] = []
  // When a step before this one drew the line, the fabric is already folded and marked
  const alreadyDrawn: Beat = {
    base: 1,
    apply: (st) => {
      if (st.p._flap) st.p._flap.rot = { axis: 'y', deg: 180, o: [fw, fh / 2] }
      st.p._paper.op = 0
      st.lines.push({ id: 'draw', kind: 'chalk', pts: line, p: 1, z: st.p[surface].z + 0.7, op: 1, on: '_fabric' })
    },
  }
  if (plan.only === 'cut') beats.push(alreadyDrawn)
  else {
    if (folded) beats.push(fold)
    beats.push(lay, onTop(trace('draw', 'chalk', line, '_fabric'), 'draw', 'Draw round'))
    if (plan.only !== 'draw') beats.push(lift)
  }
  if (plan.only === 'draw') {
    beats.push(lift, { name: 'Result', base: 1500, cam: 'wide', apply: (st) => framed(st, sheet) })
    scene.beats = beats
    return retime(scene)
  }
  beats.push(onTop(trace('cut', 'cut', line, '_fabric'), 'cut', 'Cut'))
  beats.push({
    name: 'Fabric away',
    base: 1500,
    cam: 'wide',
    apply: (st, t) => {
      const e = gentle(t)
      framed(st, sheet)
      st.p._paper.op = 0
      st.p._fabric.holed = true
      if (st.p._flap) st.p._flap.holed = true
      st.p._fabric.op = 1 - e
      if (st.p._flap) st.p._flap.op = 1 - e
      for (const l of st.lines) if (['fold', 'cut', 'draw'].includes(l.id)) l.op = 1 - clamp(e * 1.6)
      st.p.cut1.op = 1
      if (st.p.cut2) st.p.cut2.op = 1
    },
  })
  if (mode === 'fold') {
    beats.push({
      name: 'Open out',
      base: 2300,
      cam: 'wide',
      apply: (st, t) => {
        framed(st, result)
        const p = st.p.cut2
        p.rot = { axis: 'y', deg: -180 * gentle(t), o: [0, h / 2] }
        p.moving = t < 1
        st.lines.push({ id: 'crease', kind: 'crease', pts: [[x0, y0], [x0, y0 + h]], p: 1, z: p.z + 0.5, op: clamp((t - 0.8) / 0.2), on: 'cut1' })
      },
    })
  } else if (mode === 'pair') {
    // Nothing joins them: the top layer simply comes away, then turns over so both face up
    beats.push({
      name: 'Two pieces',
      base: 1300,
      cam: 'wide',
      apply: (st, t) => {
        framed(st, result)
        const e = gentle(t)
        const p = st.p.cut2
        p.ox = -gap * e
        p.lift = 26 * Math.sin(Math.PI * e)
        p.moving = t < 1
      },
    }, {
      name: 'Turn over',
      base: 2100,
      cam: 'wide',
      apply: (st, t) => {
        framed(st, result)
        const p = st.p.cut2
        p.ox = -gap
        p.rot = { axis: 'y', deg: -180 * gentle(t), o: [0, h / 2] }
        p.moving = t < 1
      },
    })
  } else beats.push({ name: 'One piece', base: 700, cam: 'wide', apply: (st) => framed(st, result) })
  if (extras.length) {
    beats.push({
      name: 'Cut the rest',
      base: 1000,
      cam: 'wide',
      apply: (st, t) => {
        framed(st, result)
        for (const x of extras) st.p[x.key].op = gentle(t)
      },
    })
  }
  scene.beats = [...beats, { name: 'Result', base: 1500, cam: 'wide', apply: (st) => framed(st, result) }]
  return retime(scene)
}

// ---------- before there are any pieces ----------
function clothScene(kind: 'wash' | 'fold-fabric'): Scene {
  const W = kind === 'wash' ? 110 : 120
  const H = 72
  const sp: ScenePiece = { key: 'cloth', o: { lines: [{ down: 0, width: W }, { down: H, width: W }] }, label: '', x: 0, y: 0, w: W, h: H, lineX: W / 2, layer: 0, side: 'right', style: 'fabric', enters: false, labelled: false }
  const m = Math.max(W, H) * 0.08
  const scene: Scene = { frame: [-m, -m, W + m, H + m], pieces: [sp], beats: [], seams: [], starts: [], durs: [], total: 1 }
  if (kind === 'wash') {
    scene.beats = [{
      name: 'Wash and dry',
      base: 2600,
      cam: 'wide',
      apply: (st, t) => {
        const p = st.p.cloth
        p.lift = 50 * Math.sin(Math.PI * gentle(t))
        p.moving = t < 1
      },
    }, wide()]
  } else {
    scene.beats = [{
      name: 'Fold',
      base: RULES.foldTime,
      cam: 'wide',
      apply: (st, t) => {
        st.p.cloth.bands = [{ id: 'centre', edge: 'centre', hinge: [], toward: [W, H / 2], S: W / 2, t: gentle(t), over: true, centre: W / 2 }]
      },
    }, wide()]
  }
  return retime(scene)
}

// ---------- every step ----------
const SETTLE: Beat = {
  name: 'Lay flat',
  base: 1800,
  cam: 'wide',
  apply: (st, t) => {
    for (const p of Object.values(st.p)) {
      p.lift = 44 * (1 - gentle(t))
      p.moving = t < 1
    }
  },
}

/**
 * The scene for one step of a guide, or null if the step has nothing to show. Works for any guide:
 * everything it needs comes from the steps and pieces.
 */
export function buildStepScene(steps: SewingStep2D[], index: number, pieces: GuidePiece[], m: UserMeasurements): Scene | null {
  const step = steps[index]
  if (!step) return null
  const plans = steps.map((s, i) => planStep(s, i, steps, pieces))
  const plan = plans[index]
  if (plan.kind === 'none') return null
  if (plan.kind === 'wash' || plan.kind === 'fold-fabric') return clothScene(plan.kind)
  if (plan.kind === 'cut') {
    const piece = pieces.find((p) => p.id === step.pieceId?.split('#')[0])
    return piece ? cutScene(piece, m, plan) : null
  }

  // A step with no piece of its own (the final press, hanging) is about everything sewn so far
  const lastPiece = [...steps.slice(0, index)].reverse().find((s) => s.pieceId)?.pieceId
  const shown = step.pieceId ? steps : steps.map((s, i) => (i === index ? { ...s, pieceId: lastPiece } : s))
  const assembly = assemblyAt(shown, index)
  if (!assembly) return null
  const joining = assembly.joining.length > 0
  const scene = buildScene(
    { action: joining ? step.action : 'prepare', annotation: step.annotation, fabricSide: step.fabricSide, pieceId: shown[index].pieceId, title: step.title },
    joining ? assembly : { ...assembly, joining: [], recentJoin: false },
    pieces,
    m,
  )
  if (!scene) return null
  for (const p of scene.pieces) {
    const base = pieces.find((q) => q.id === p.key.split('#')[0])
    if (!base) continue
    const nth = Number(p.key.split('#')[1] ?? 1)
    const count = quantity(base)
    p.label = count > 1 ? `${base.label}${nth}` : base.label
  }

  // Everything earlier steps left behind
  const sizeOf = (pieceId: string, edge: PieceEdge) => {
    const base = pieces.find((p) => p.id === pieceId.split('#')[0])
    if (!base) return 1
    const { width, height } = outlineSize(outlineOf(base, m))
    return (edge === 'top' || edge === 'bottom' ? height : width) / 2
  }
  const left: Left[] = []
  for (let i = 0; i < index; i++) left.push(...leavesOf(plans[i], steps[i], left, sizeOf))

  const target = scene.pieces.find((p) => p.key === step.pieceId) ?? scene.pieces[0]
  const beats: Beat[] = []
  let wrongUp = false
  const fold = plan.kind === 'fold' ? plan : null

  const layered = joining && step.join === 'layer' && (plan.kind === 'pin' || plan.kind === 'sew') && plan.edges
  if (layered && (plan.kind === 'pin' || plan.kind === 'sew')) {
    // Laid on top, then worked along the edge the step names
    const top = scene.pieces.filter((p) => assembly.joining.flat().some((g) => g.id === p.key))
    const piece = top[top.length - 1]
    beats.push({
      name: 'Lay on',
      base: 1300,
      cam: 'wide',
      focus: top.map((p) => p.key),
      apply: (st, t) => top.forEach((p) => approach(p.key, { dy: -1 }).apply(st, t)),
    })
    for (const edge of plan.edges ?? []) {
      const line = onCloth(piece, inset(edgeLine(piece, edge), 1.5, middleOf(piece)), 0.6)
      beats.push(pinAlong(scene, `${edge}-pin`, line, piece.key))
      if (plan.kind === 'sew') beats.push(sewAlong(scene, `${edge}-pin`, line, piece.key, plan.stitch, 1.5, plan.hand))
    }
  } else if (joining) {
    // Pieces coming together: they come in, then the step's own pin, sew or press along their seam
    beats.push(...scene.beats.slice(0, -1).map((b) => fitPts(scene, b)))
  } else if (fold) {
    wrongUp = true
    for (const edge of fold.edges) {
      const widths = fold.widths.length ? fold.widths : [sizeOf(step.pieceId ?? '', edge)]
      let offset = foldedWidth(left, step.pieceId ?? '', edge)
      for (const width of widths) {
        beats.push(foldAlong(scene, target, edge, offset, width))
        offset += width
      }
      const lastWidth = widths[widths.length - 1]
      if (fold.press) beats.push(ironAlong(scene, target, edge, offset - lastWidth, lastWidth))
      if (fold.pin) {
        const line = onCloth(target, inset(edgeLine(target, edge), offset + lastWidth - 0.5, middleOf(target)), 0.6)
        beats.push(pinAlong(scene, `${edge}-pin`, line, target.key, lastWidth))
      }
    }
  } else if (plan.kind === 'press') {
    if (plan.edges) {
      for (const edge of plan.edges) {
        const total = foldedWidth(left, step.pieceId ?? '', edge)
        beats.push(ironAlong(scene, target, edge, total, Math.max(1.5, lastFoldWidth(left, step.pieceId ?? '', edge))))
      }
    } else if (!step.pieceId) {
      // The whole garment: the iron across its middle, from one side to the other
      const xs = scene.pieces.map((p) => [p.x, p.x + p.w]).flat()
      const ys = scene.pieces.map((p) => [p.y, p.y + p.h]).flat()
      const y = (Math.min(...ys) + Math.max(...ys)) / 2
      beats.push(press([[Math.min(...xs) + 1, y], [Math.max(...xs) - 1, y]], target.key))
    } else {
      const line = onCloth(target, inset(edgeLine(target, 'left'), target.w / 2, middleOf(target)), 1)
      beats.push(press(line, target.key))
    }
  } else if (plan.kind === 'pin' && plan.edges) {
    for (const edge of plan.edges) beats.push(pinAlong(scene, `${edge}-pin`, onCloth(target, inset(edgeLine(target, edge), Math.max(1.5, foldedWidth(left, target.key, edge)), middleOf(target)), 0.6), target.key))
  } else if (plan.kind === 'sew' && plan.edges) {
    for (const edge of plan.edges) {
      const folded = foldedWidth(left, step.pieceId ?? '', edge) > 0
      if (folded) wrongUp = true
      const at0 = sewInset(left, step.pieceId ?? '', edge, plan)
      const line = onCloth(target, inset(edgeLine(target, edge), at0, middleOf(target)), 0.6)
      beats.push(sewAlong(scene, `${edge}-sew`, line, target.key, plan.stitch, Math.max(1.5, at0), plan.hand))
      if (plan.rows > 1) {
        const second = onCloth(target, inset(edgeLine(target, edge), at0 + 0.5, middleOf(target)), 0.6)
        beats.push(sewAlong(scene, `${edge}-sew2`, second, target.key, plan.stitch, Math.max(1.5, at0), plan.hand))
      }
    }
  } else if (plan.kind === 'dart') {
    beats.push(sewAlong(scene, 'dart', dartLine(target, plan.edge), target.key, 'stitch', 3))
  } else if (plan.kind === 'marks') {
    pointsAlong(target, plan.edge, plan.count).forEach((q, i) => {
      const beat = trace(`mark-${i}`, 'chalk', [[q[0] - 0.9, q[1]], [q[0] + 0.9, q[1]]], target.key)
      beats.push({ ...beat, name: i ? 'Next' : 'Mark', base: 700, cam: 'tool', zoom: zoomFor(scene, 2.5) })
    })
  } else if (plan.kind === 'buttons') {
    pointsAlong(target, plan.edge, plan.count).forEach((q, i) => {
      beats.push({
        name: i ? 'Next' : 'Sew by hand',
        base: i === 0 ? 2200 : 1200,
        cam: 'tool',
        zoom: zoomFor(scene, 2.5),
        apply: (st, t) => {
          st.lines.push({ id: `button-${i}`, kind: 'button', pts: [q, q], p: clamp(t * 5), z: st.p[target.key].z + 0.6, op: clamp(t * 5), on: target.key })
          if (t < 1) st.tool = { on: target.key, kind: 'hand', x: q[0] + 0.1, y: q[1] + 0.1, ang: -0.7, z: st.p[target.key].z + 2, phase: t * (i === 0 ? 3 : 1.6) }
        },
      })
    })
  } else if (plan.kind === 'settle') {
    beats.push(SETTLE)
  } else {
    // A seam just joined: the general engine knows where it runs
    const own = buildScene({ action: step.action, annotation: step.annotation, fabricSide: step.fabricSide, pieceId: step.pieceId, title: step.title }, assembly, pieces, m)
    if (own) beats.push(...own.beats.slice(0, -1).map((b) => fitPts(scene, b)))
  }

  scene.beats = [memory(scene, left, wrongUp), ...beats, wide()]
  return retime(scene)
}

const quantity = (p: GuidePiece) => p.quantity ?? Number(p.name?.match(/cut (\d+)/i)?.[1] ?? 1)

/** A camera that looks at a line must see all of it */
function fitPts(s: Scene, b: Beat): Beat {
  if (b.cam !== 'pts' || !b.pts) return b
  const xs = b.pts.map((q) => q[0])
  const ys = b.pts.map((q) => q[1])
  const w = Math.max(...xs) - Math.min(...xs) + 12
  const h = Math.max(...ys) - Math.min(...ys) + 12
  return { ...b, zoom: clamp(Math.min((s.frame[2] - s.frame[0]) / w, (s.frame[3] - s.frame[1]) / h), 1, RULES.zoom) }
}
