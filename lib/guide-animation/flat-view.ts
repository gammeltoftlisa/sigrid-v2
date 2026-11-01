/**
 * Draws a guide scene flat, from straight above, on the same net as the page. The state comes from
 * lib/guide-scene.ts, the plan from ./rules.ts. Everything inside is in centimetres; hairlines keep
 * their screen width whatever the camera does.
 */
import { outlineCommands, type OutlineCmd } from '@/lib/piece-outline'
import { clamp, sampleCmds, stateAt, upTo, type PieceState, type Pt, type Scene, type ScenePiece, type SceneState, type Tool } from '@/lib/guide-scene'
import { clothGL, type ClothDraw } from './cloth-gl'
import { TOOL_GRADIENTS, TOOL_SIZE, machineFrontBed, toolMarkup } from './tools'

type M = { a: number; d: number; e: number; f: number }
const mat = (m: M) => `matrix(${m.a.toFixed(5)},0,0,${m.d.toFixed(5)},${m.e.toFixed(3)},${m.f.toFixed(3)})`
const ease = (t: number) => t * t * (3 - 2 * t)

function pathOf(cmds: OutlineCmd[], dx = 0, dy = 0) {
  return cmds.map(([k, ...v]) => (k === 'Z' ? 'Z' : k + v.map((n, i) => (n + (i % 2 ? dy : dx)).toFixed(3)).join(','))).join(' ')
}

interface CurlSlot { clip: SVGPathElement; clipId: string; shadowG: SVGGElement; shadow: SVGPathElement; turnG: SVGGElement; patches: { fill: SVGPathElement }[]; outline: SVGPathElement; used: boolean }
interface PieceEls {
  shadowG: SVGGElement
  shadowNest: SVGGElement[]
  wholeNest: SVGGElement[]
  defs: SVGDefsElement
  slots: CurlSlot[]
  far: SVGPathElement
  near: SVGPathElement
  contact: SVGPathElement
  g: SVGGElement
  whole: SVGGElement
  fill: SVGPathElement
  edge: SVGPathElement
  label: SVGTextElement
  labelG: SVGGElement
  ghost: SVGPathElement
  ghostEdge: SVGPathElement
  wasCurl?: boolean
  flushClip?: SVGRectElement
  landedAt?: number
  paper: SVGGElement
  slot: SVGGElement
  d: string
  state: string
  html: string
}

/** A fold in progress: which way it bends, the line it folds about, the far edge and how far along it is */
interface Curl { axis: 'x' | 'y' | 'edge'; hinge: number; far: number; t: number; stays: boolean; frame?: EdgeFrame; id?: string; sweep?: boolean; bounded?: boolean }

/** A fold line that needn't be straight: a point on it from its length, and the way out towards the edge */
interface EdgeFrame { V: number; at: (a: number, b: number) => Pt }

function edgeFrame(hinge: Pt[], toward: Pt): EdgeFrame {
  const lens = [0]
  for (let i = 1; i < hinge.length; i++) lens.push(lens[i - 1] + Math.hypot(hinge[i][0] - hinge[i - 1][0], hinge[i][1] - hinge[i - 1][1]))
  const V = lens[lens.length - 1] || 1
  const N = 80
  const px = new Float32Array(N + 1)
  const py = new Float32Array(N + 1)
  let i = 1
  for (let k = 0; k <= N; k++) {
    const d = (V * k) / N
    while (i < hinge.length - 1 && lens[i] < d) i++
    const u = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1)
    px[k] = hinge[i - 1][0] + (hinge[i][0] - hinge[i - 1][0]) * u
    py[k] = hinge[i - 1][1] + (hinge[i][1] - hinge[i - 1][1]) * u
  }
  const rawNormal = (f: number): Pt => {
    const a0 = Math.max(0, Math.floor(f) - 1)
    const a1 = Math.min(N, Math.floor(f) + 2)
    const nx = -(py[a1] - py[a0])
    const ny = px[a1] - px[a0]
    const l = Math.hypot(nx, ny) || 1
    return [nx / l, ny / l]
  }
  // Which way is out is decided once, at the middle of the line, so it can't change along a curve
  const midN = rawNormal(N / 2)
  const flipOut = (toward[0] - px[N >> 1]) * midN[0] + (toward[1] - py[N >> 1]) * midN[1] < 0 ? -1 : 1
  const out = (b: number): Pt => {
    const [nx, ny] = rawNormal(clamp(b / V) * N)
    return [nx * flipOut, ny * flipOut]
  }
  const point = (b: number): Pt => {
    if (b <= 0) {
      const t0 = [px[1] - px[0], py[1] - py[0]]
      const l = Math.hypot(t0[0], t0[1]) || 1
      return [px[0] + (t0[0] / l) * b, py[0] + (t0[1] / l) * b]
    }
    if (b >= V) {
      const t1 = [px[N] - px[N - 1], py[N] - py[N - 1]]
      const l = Math.hypot(t1[0], t1[1]) || 1
      return [px[N] + (t1[0] / l) * (b - V), py[N] + (t1[1] / l) * (b - V)]
    }
    const f = (b / V) * N
    const k = Math.min(N - 1, Math.floor(f))
    const u = f - k
    return [px[k] + (px[k + 1] - px[k]) * u, py[k] + (py[k + 1] - py[k]) * u]
  }
  return { V, at: (a, b) => {
    const [x, y] = point(b)
    const [nx, ny] = out(clamp(b, 0, V))
    return [x + nx * a, y + ny * a]
  } }
}

interface MeshCell { pts: Pt[]; edges: number[]; cu: number; cv: number; du: number; dv: number; z: number }
const CLOTH = [205, 198, 186]
const FACE: Record<string, number[]> = { right: CLOTH, wrong: CLOTH, interfacing: CLOTH, paper: [255, 253, 248] }

/**
 * The common machine stitches, drawn at one fine size on screen. Straight kinds are a dash in CSS;
 * these others are a path: zigzag, overlock over the raw edge, close satin stitch, blind hem.
 */
function stitchPath(line: Pt[], kind: string, pxPerCm: number): Pt[] {
  const shape: Record<string, { amp: number; wave: number; pattern: string }> = {
    zigzag: { amp: 2, wave: 3.4, pattern: 'zig' },
    overlock: { amp: 3.2, wave: 2.4, pattern: 'saw' },
    satin: { amp: 1.5, wave: 1.3, pattern: 'zig' },
    blind: { amp: 3, wave: 3.2, pattern: 'blind' },
  }
  const f = shape[kind]
  if (!f || line.length < 2) return line
  const out: Pt[] = []
  const amp = f.amp / pxPerCm
  const wave = f.wave / pxPerCm
  let i = 0
  for (let k = 1; k < line.length; k++) {
    const a = line[k - 1]
    const b = line[k]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (len < 1e-6) continue
    const nx = -(b[1] - a[1]) / len
    const ny = (b[0] - a[0]) / len
    let d = 0
    while (d < len && out.length < 2500) {
      const x = a[0] + ((b[0] - a[0]) * d) / len
      const y = a[1] + ((b[1] - a[1]) * d) / len
      let o = 0
      if (f.pattern === 'zig') o = i % 2 ? amp : -amp
      else if (f.pattern === 'saw') o = i % 2 ? amp : 0
      else if (f.pattern === 'blind') o = i % 6 === 0 ? amp : 0
      out.push([x + nx * o, y + ny * o])
      d += wave
      i++
    }
  }
  out.push(line[line.length - 1])
  return out
}

const polyPath = (pts: Pt[], close = true) => 'M' + pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join('L') + (close ? 'Z' : '')

const svgEl = <T extends SVGElement>(name: string, attrs: Record<string, string | number> = {}, parent?: SVGElement) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name) as T
  for (const k in attrs) el.setAttribute(k, String(attrs[k]))
  parent?.appendChild(el)
  return el
}

export class FlatSceneView {
  private W = 0
  private H = 0
  private s = 1
  private ox = 0
  private oy = 0
  private svg!: SVGSVGElement
  private cam!: SVGGElement
  private under!: SVGGElement
  private toolSh!: SVGGElement
  private toolNear!: SVGGElement
  private now = 0
  private glFade = 1
  private frames = new Map<string, EdgeFrame>()
  private glCanvas: HTMLCanvasElement | null = null
  private glCtx: CanvasRenderingContext2D | null = null
  private glDraws: ClothDraw[] = []
  private glDrew = false
  private camK = 1
  private camE = 0
  private camF = 0
  private clothTex = new Map<string, { front: WebGLTexture; back: WebGLTexture }>()
  private grids = new Map<string, { uvs: Float32Array; indices: Uint16Array; pos: Float32Array; nor: Float32Array; lift: Float32Array }>()
  private meshes = new Map<string, { cells: MeshCell[]; V: number; S: number; sign: number }>()
  private toolEl!: SVGGElement
  private top!: SVGGElement
  private els: Record<string, PieceEls> = {}
  private sorted: ScenePiece[]
  private angle: number | null = null
  private lastTime = 0
  private camZ = 1
  /** The moments a tool stands still before and after each beat, so it can arrive and leave */
  private poses: { start: number; end: number; first: Tool; last: Tool }[] = []

  constructor(private root: HTMLElement, private scene: Scene, private id: string) {
    this.sorted = [...scene.pieces].sort((a, b) => a.layer - b.layer)
    scene.beats.forEach((_, i) => {
      const start = scene.starts[i]
      const dur = scene.durs[i]
      const first = stateAt(scene, start + 0.5).tool
      const last = stateAt(scene, start + dur - 0.5).tool
      if (first && last) this.poses.push({ start, end: start + dur, first, last })
    })
    this.build()
  }

  destroy() {
    this.freeCloth()
    this.root.innerHTML = ''
  }

  private freeCloth() {
    const gl = clothGL()
    if (gl) for (const t of this.clothTex.values()) {
      gl.deleteTexture(t.front)
      gl.deleteTexture(t.back)
    }
    this.clothTex.clear()
  }

  build() {
    const r = this.root.getBoundingClientRect()
    this.W = r.width
    this.H = r.height
    this.freeCloth()
    this.meshes.clear()
    this.root.innerHTML = ''
    if (!this.W || !this.H) return
    const [x0, y0, x1, y1] = this.scene.frame
    const fw = x1 - x0
    const fh = y1 - y0
    this.s = Math.min((this.W * 0.86) / fw, (this.H * 0.84) / fh)
    this.ox = this.W / 2 - (x0 + fw / 2) * this.s
    this.oy = this.H / 2 - (y0 + fh / 2) * this.s
    const svg = svgEl<SVGSVGElement>('svg', { class: 'fv', width: this.W, height: this.H, 'aria-hidden': 'true' })
    this.root.appendChild(svg)
    this.svg = svg
    this.buildDefs(svgEl('defs', {}, svg))
    this.cam = svgEl('g', {}, svg)
    this.buildNet(svgEl('g', { class: 'fv-net' }, this.cam))
    this.under = svgEl('g', { class: 'fv-under' }, this.cam)
    this.els = {}
    for (const p of this.sorted) this.buildPiece(p)
    this.top = svgEl('g', {}, this.cam)
    this.toolSh = svgEl('g', { class: 'fv-sil', filter: `url(#${this.id}-toolblur)` }, this.cam)
    this.toolNear = svgEl('g', { class: 'fv-sil near', filter: `url(#${this.id}-tight)` }, this.cam)
    this.toolEl = svgEl('g', { class: 'fv-tool' }, this.cam)
    // Folding cloth is drawn above the scene; nothing else is in the air at that moment
    if (clothGL()) {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const c = document.createElement('canvas')
      c.className = 'fv-gl'
      c.width = Math.ceil(this.W * dpr)
      c.height = Math.ceil(this.H * dpr)
      this.root.appendChild(c)
      this.glCanvas = c
      this.glCtx = c.getContext('2d')
    } else {
      this.glCanvas = null
      this.glCtx = null
    }
  }

  private buildDefs(defs: SVGDefsElement) {
    const s = this.s
    const id = this.id
    const px = (n: number) => (n / s).toFixed(4)
    defs.innerHTML = `${TOOL_GRADIENTS}
      <filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${px(11)}"/></filter>
      <filter id="${id}-mid" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="${px(3.2)}"/></filter>
      <filter id="${id}-shade" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${px(9)}"/></filter>
      <filter id="${id}-tight" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${px(1.4)}"/></filter>
      <filter id="${id}-toolblur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${px(7)}"/></filter>
      `
  }

  /** The net of the page's background, flat: squares of real centimetres, every fifth line heavier */
  private buildNet(g: SVGGElement) {
    const [x0, y0, x1, y1] = this.scene.frame
    const fw = x1 - x0
    const fh = y1 - y0
    const cell = [1, 2, 5, 10, 20].find((c) => c * this.s >= 13) ?? 25
    const pad = Math.max(fw, fh) * 2.4 + 60
    const left = Math.floor((x0 - pad) / cell)
    const right = Math.ceil((x1 + pad) / cell)
    const topC = Math.floor((y0 - pad) / cell)
    const bottom = Math.ceil((y1 + pad) / cell)
    const minor: string[] = []
    const major: string[] = []
    for (let i = left; i <= right; i++) (i % 5 === 0 ? major : minor).push(`M${i * cell} ${topC * cell}V${bottom * cell}`)
    for (let j = topC; j <= bottom; j++) (j % 5 === 0 ? major : minor).push(`M${left * cell} ${j * cell}H${right * cell}`)
    svgEl('path', { class: 'fv-minor', d: minor.join('') }, g)
    svgEl('path', { class: 'fv-major', d: major.join('') }, g)
  }

  private buildPiece(sp: ScenePiece) {
    const shadowG = svgEl<SVGGElement>('g', {}, this.cam)
    let shadowCur = shadowG
    const shadowNest: SVGGElement[] = []
    for (let k = 0; k < 6; k++) {
      shadowCur = svgEl<SVGGElement>('g', {}, shadowCur)
      shadowNest.push(shadowCur)
    }
    const far = svgEl<SVGPathElement>('path', { class: 'fv-shadow far', filter: `url(#${this.id}-soft)`, 'fill-rule': 'evenodd' }, shadowCur)
    const near = svgEl<SVGPathElement>('path', { class: 'fv-shadow near', filter: `url(#${this.id}-mid)`, 'fill-rule': 'evenodd' }, shadowCur)
    const contact = svgEl<SVGPathElement>('path', { class: 'fv-contact', 'fill-rule': 'evenodd' }, shadowCur)
    const g = svgEl<SVGGElement>('g', {}, this.cam)
    const defs = svgEl<SVGDefsElement>('defs', {}, g)
    // Nested so that a fold can be cut away from each edge of the piece at once
    const nest = (parent: SVGGElement) => {
      let cur = parent
      const list: SVGGElement[] = []
      for (let k = 0; k < 6; k++) {
        cur = svgEl<SVGGElement>('g', {}, cur)
        list.push(cur)
      }
      return { list, inner: cur }
    }
    const wholeNest = nest(g)
    const whole = svgEl<SVGGElement>('g', {}, wholeNest.inner)
    const fill = svgEl<SVGPathElement>('path', { 'fill-rule': 'evenodd' }, whole)
    // Cloth has thickness: the cut edge darkens softly just inside the outline
    const edge = svgEl<SVGPathElement>('path', { fill: 'none' }, whole)
    const ghost = svgEl<SVGPathElement>('path', { 'fill-rule': 'evenodd', style: 'display:none' }, g)
    const ghostEdge = svgEl<SVGPathElement>('path', { fill: 'none', style: 'display:none' }, g)
    const paper = svgEl<SVGGElement>('g', { class: 'fv-paperbits', style: 'display:none' }, g)
    const labelG = svgEl<SVGGElement>('g', { class: 'fv-labelg' }, g)
    const chars = sp.label.length
    if (sp.label) svgEl('rect', { class: 'fv-label-bg', x: -(chars * 7.6 + 12) / 2, y: -10.5, width: chars * 7.6 + 12, height: 21, rx: 10.5 }, labelG)
    const label = svgEl<SVGTextElement>('text', { class: 'fv-label', 'text-anchor': 'middle', 'font-size': 12.5, y: 4.4 }, labelG)
    label.textContent = sp.label
    if (sp.style === 'paper') {
      const gx = sp.lineX === 0 ? sp.w * 0.45 : sp.lineX
      const y1 = sp.h * 0.2
      const y2 = sp.h * 0.8
      const a = 7 / this.s
      svgEl('path', { class: 'fv-grain', d: `M${gx},${y1} L${gx},${y2} M${gx - a / 2},${y1 + a} L${gx},${y1} L${gx + a / 2},${y1 + a} M${gx - a / 2},${y2 - a} L${gx},${y2} L${gx + a / 2},${y2 - a}` }, paper)
      const t = svgEl<SVGTextElement>('text', { class: 'fv-papertext', x: gx + 7 / this.s, y: sp.h * 0.5, 'font-size': 10.5 / this.s }, paper)
      t.textContent = sp.label
    }
    const slot = svgEl<SVGGElement>('g', {}, this.cam)
    this.els[sp.key] = { shadowG, shadowNest, wholeNest: wholeNest.list, defs, slots: [], far, near, contact, g, whole, fill, edge, label, labelG, ghost, ghostEdge, paper, slot, d: '', state: '', html: '' }
  }

  private sp(key: string) {
    return this.sorted.find((p) => p.key === key)!
  }

  private curlOf(p: PieceState, d: ScenePiece): Curl | null {
    if (p.style === 'paper') return null
    if (p.rot && p.rot.axis === 'y') {
      const t = Math.abs(p.rot.deg) / 180
      if (t <= 0.001 || t >= 0.999) return null
      const hinge = p.rot.o[0]
      return { axis: 'x', hinge, far: Math.abs(hinge) > Math.abs(hinge - d.w) ? 0 : d.w, t, stays: false }
    }
    return null
  }

  /** The folds on a piece's edges: the latest on each edge, and the one before it while it's being covered */
  private bandCurls(p: PieceState, d: ScenePiece): { curl: Curl; over: boolean; coveredBy?: number }[] {
    const bands = p.bands
    if (!bands?.length) return []
    const out: { curl: Curl; over: boolean; coveredBy?: number }[] = []
    const edges = [...new Set(bands.map((b) => b.edge))]
    for (const edge of edges) {
      const list = bands.filter((b) => b.edge === edge && b.t > 0.001)
      list.forEach((b, i) => {
        const next = list[i + 1]
        // once the next fold has passed all the way along, this one is inside it
        if (next && next.t >= 0.999) return
        if (b.centre != null) {
          out.push({ curl: { axis: 'x', hinge: b.centre, far: d.w, t: clamp(b.t), stays: true, id: b.id }, over: b.over })
          return
        }
        const key = `${d.key}|${b.id}|${b.S}`
        let frame = this.frames.get(key)
        if (!frame) {
          frame = edgeFrame(b.hinge, b.toward)
          this.frames.set(key, frame)
        }
        out.push({ curl: { axis: 'edge', hinge: 0, far: b.S, t: clamp(b.t), stays: true, frame, id: b.id, sweep: b.sweep, bounded: b.bounded }, over: b.over, coveredBy: next ? out.length + 1 : undefined })
      })
    }
    return out
  }

  /** Where a piece is on the mat: it grows a little as it lifts towards the camera. A finished turn is a mirror about its axis. */
  private matrix(p: PieceState, d: ScenePiece): M {
    const X = p.x + p.ox
    const Y = p.y + p.oy
    if (this.curlOf(p, d)) return { a: 1, d: 1, e: X, f: Y }
    const L = 1 + p.lift / 1400
    const cx = d.w / 2
    const cy = d.h / 2
    const m: M = { a: L, d: L, e: X + cx - cx * L, f: Y + cy - cy * L }
    if (p.rot) {
      const c = Math.cos((p.rot.deg * Math.PI) / 180)
      const [ox, oy] = p.rot.o
      if (p.rot.axis === 'y') {
        m.e += L * (ox - c * ox)
        m.a *= c
      } else {
        m.f += L * (oy - c * oy)
        m.d *= c
      }
    }
    return m
  }

  private faceClass(p: PieceState, flipped: boolean) {
    if (p.style === 'paper') return 'paper'
    if (p.style === 'interfacing') return 'interfacing'
    return flipped ? (p.side === 'right' ? 'wrong' : 'right') : p.side
  }

  private setFace(e: PieceEls, face: string) {
    e.fill.setAttribute('class', `fv-face ${face}`)
    e.edge.setAttribute('class', `fv-edge ${face}`)
  }

  /** The outline as many points, so a fold or a sway can bend its straight edges too */
  private outlinePoints(d: ScenePiece, hem: number): Pt[] {
    const raw = sampleCmds(outlineCommands({ ...d.o, hemCurve: hem }, d.lineX))
    const step = Math.max(d.w, d.h) / 70
    const out: Pt[] = []
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i]
      const b = raw[(i + 1) % raw.length]
      const n = Math.min(90, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step))
      for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n])
    }
    return out
  }

  /** The piece's cloth past the fold line, cut into small patches that bend and catch the light on their own */
  private meshFor(p: PieceState, d: ScenePiece, c: Curl) {
    const key = `${d.key}|${c.axis}|${c.hinge}|${c.far}|${c.id ?? ''}`
    const hit = this.meshes.get(key)
    if (hit) return hit
    const big = Math.max(d.w, d.h)
    const V = c.frame ? c.frame.V : c.axis === 'x' ? d.h : d.w
    const S = Math.abs(c.far - c.hinge)
    const sign = Math.sign(c.far - c.hinge) || 1
    const K = c.frame ? 8 : Math.round(clamp(S / (big / 34), 7, 34))
    const L = c.frame ? Math.round(clamp(V / 3, 8, 30)) : Math.round(clamp(V / (big / 15), 6, 15))
    const outline: Pt[] = c.frame ? [[0, 0], [S, 0], [S, V], [0, V]] : this.outlinePoints(d, p.hem).map(([x, y]) => (c.axis === 'x' ? [x, y] : [y, x]))
    const cut = (poly: Pt[], axis: 0 | 1, at: number, keepAbove: boolean) => {
      const out: Pt[] = []
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i]
        const b = poly[(i + 1) % poly.length]
        const ai = keepAbove ? a[axis] >= at : a[axis] <= at
        const bi = keepAbove ? b[axis] >= at : b[axis] <= at
        if (ai) out.push(a)
        if (ai !== bi) {
          const t = (at - a[axis]) / (b[axis] - a[axis])
          out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
        }
      }
      return out
    }
    const cells: MeshCell[] = []
    for (let i = 0; i < K; i++) {
      const u0 = c.hinge + (sign * S * i) / K
      const u1 = c.hinge + (sign * S * (i + 1)) / K
      const [uA, uB] = u0 < u1 ? [u0, u1] : [u1, u0]
      let band = cut(cut(outline, 0, uA, true), 0, uB, false)
      if (band.length < 3) continue
      for (let j = 0; j < L; j++) {
        const v0 = (V * j) / L
        const v1 = (V * (j + 1)) / L
        const pts = cut(cut(band, 1, v0, true), 1, v1, false)
        if (pts.length < 3) continue
        let area = 0
        for (let q = 0; q < pts.length; q++) {
          const [ax, ay] = pts[q]
          const [bx, by] = pts[(q + 1) % pts.length]
          area += ax * by - bx * ay
        }
        if (Math.abs(area) < 1e-3) continue
        const eps = 1e-3
        const onCut = (n: number, m: number) => Math.abs(n - m) < eps
        const edges: number[] = []
        pts.forEach((a, q) => {
          const b = pts[(q + 1) % pts.length]
          // a cut line inside the cloth isn't an edge; the mesh's outer bounds can be the cloth's real edge
          const uLo = Math.min(c.hinge, c.far)
          const uHi = Math.max(c.hinge, c.far)
          const inside = (onCut(a[0], uA) && onCut(b[0], uA) && !onCut(uA, uLo === c.far ? uLo : Infinity)) || (onCut(a[0], uB) && onCut(b[0], uB) && !onCut(uB, uHi === c.far ? uHi : Infinity)) || (onCut(a[1], v0) && onCut(b[1], v0) && (j > 0 || !!c.frame)) || (onCut(a[1], v1) && onCut(b[1], v1) && (j < L - 1 || !!c.frame))
          if (!inside) edges.push(q)
        })
        cells.push({ pts, edges, cu: (uA + uB) / 2, cv: (v0 + v1) / 2, du: (uB - uA) / 2, dv: (v1 - v0) / 2, z: 0 })
      }
      band = []
    }
    const mesh = { cells, V, S, sign }
    this.meshes.set(key, mesh)
    return mesh
  }

  /**
   * A fold as cloth does it, from above. Hands take the far edge at its corners: it lifts, arches
   * over and comes down on the other side, and the soft bend it hangs from travels back to the fold
   * line. The shape is a curve of fixed length, so the cloth never stretches: seen from above it
   * looks shorter in the air, the way real cloth does. Each patch is lit from its own slope.
   */
  private drawCurl(p: PieceState, d: ScenePiece, e: PieceEls, c: Curl, slot: CurlSlot) {
    const mesh = this.meshFor(p, d, c)
    const { V, S, sign, cells } = mesh
    const time = this.now / 1000
    const env = Math.sin(Math.PI * clamp(c.t))
    const smooth = (a: number, b: number, x: number) => {
      const t = clamp((x - a) / (b - a))
      return t * t * (3 - 2 * t)
    }
    // One lengthwise slice of the cloth at a time: flat, then its bend, then what's over it
    const COLS = 24
    const STEPS = 54
    const tableX: Float32Array[] = []
    const tableZ: Float32Array[] = []
    const bendStart: number[] = []
    for (let col = 0; col <= COLS; col++) {
      const q = col / COLS
      // the corners, where it's held, go first; the middle hangs back
      const tv = c.sweep ? clamp((c.t - q * 0.55) / 0.45) : clamp(c.t + env * 0.035 * ((2 * q - 1) ** 2 - 0.33))
      const envV = Math.sin(Math.PI * tv)
      // One long, unhurried movement: the side rises into a single arch and lays itself down
      const start = S * (1 - smooth(0, 0.72, tv))
      const settle = smooth(0.42, 1, tv)
      // a crisp edge once it's down, however wide the fold is
      const finalBend = c.stays ? Math.min(0.08, 0.3 / S) : 0.012 * Math.pow(envV, 0.2)
      const bend = Math.max(0.0001, (S - start) * (1 - settle) + S * finalBend * settle)
      const top = Math.PI * smooth(0, 0.74, tv)
      // barely any flutter: an easy fold, not a windy one
      const wave = envV * 0.03 * Math.sin(q * Math.PI * 2.1 + 0.8 + time * 0.5)
      const droop = 0
      const xs = new Float32Array(STEPS + 1)
      const zs = new Float32Array(STEPS + 1)
      const ds = S / STEPS
      let x = 0
      let z = 0
      for (let i = 1; i <= STEPS; i++) {
        const s0 = (i - 1) * ds
        // Fine steps through the bend, however tight it gets, so it never jumps as it closes
        const near = s0 + ds >= start - ds && s0 <= start + bend + ds
        const sub = near ? 16 : 1
        const h = ds / sub
        for (let j = 0; j < sub; j++) {
          const sMid = s0 + (j + 0.5) * h
          const r = smooth(start, start + bend, sMid)
          const past = Math.max(0, sMid - start - bend) / S
          const phi = (top + wave) * r + droop * clamp(past * 3 + (sMid - start) / S)
          x += Math.cos(phi) * h
          z += Math.sin(phi) * h
          // cloth can't go through what's under it
          if (z < 0) z = 0
        }
        xs[i] = x
        zs[i] = z
      }
      tableX.push(xs)
      tableZ.push(zs)
      bendStart.push(start)
    }
    const sample = (t: Float32Array[], s: number, v: number) => {
      const fc = clamp(v / V) * COLS
      const c0 = Math.min(COLS - 1, Math.floor(fc))
      const kc = fc - c0
      const fs = clamp(s / S) * STEPS
      const s0 = Math.min(STEPS - 1, Math.floor(fs))
      const ks = fs - s0
      const a = t[c0][s0] + (t[c0][s0 + 1] - t[c0][s0]) * ks
      const b = t[c0 + 1][s0] + (t[c0 + 1][s0 + 1] - t[c0 + 1][s0]) * ks
      return a + (b - a) * kc
    }
    const mid = V / 2
    const map = (u: number, v: number): [number, number, number] => {
      const s = sign * (u - c.hinge)
      if (s <= 0) return [u, v, 0]
      const z = sample(tableZ, s, v)
      const up = clamp(z / (S * 0.3 + 0.001))
      // gathered in slightly while it hangs, as cloth does when carried
      const vv = v + (mid - v) * 0.045 * up
      return [c.hinge + sign * sample(tableX, s, v), vv, z]
    }
    const world = (a: number, b: number): Pt => (c.frame ? c.frame.at(a, b) : c.axis === 'x' ? [a, b] : [b, a])
    // The flat part stays the piece's own face, cut along where the bend begins
    const edge: Pt[] = []
    const useGL = !!(this.glCtx && clothGL() && !(c.stays && c.t >= 0.9995) && c.t > 0.002)
    // A fold that stays down hands over from the moving cloth to the resting one in a soft crossfade
    const crossing = useGL && c.stays && c.t > 0.93
    const landing = useGL && !c.stays && c.t > 0.95 && c.t > 0.5
    const marginAt = (col: number) => (useGL ? S * 0.035 * clamp(bendStart[col] / (S * 0.1)) : 0)
    for (let col = 0; col <= COLS; col++) edge.push(world(c.hinge + sign * (bendStart[col] + marginAt(col)), (V * col) / COLS))
    const beyond = c.hinge - sign * 4000
    const flat = [world(c.hinge + sign * (bendStart[0] + marginAt(0)), -4000), ...edge, world(c.hinge + sign * (bendStart[COLS] + marginAt(COLS)), V + 4000), world(beyond, V + 4000), world(beyond, -4000)]
    // A fold along a stretch of cloth only takes away that stretch; one along a whole edge, everything past it
    if (c.bounded) {
      const strip: Pt[] = []
      for (let col = 0; col <= COLS; col++) strip.push(world(c.hinge + sign * (bendStart[col] + marginAt(col)), (V * col) / COLS))
      for (let col = COLS; col >= 0; col--) strip.push(world(c.hinge + sign * (S + 0.6), (V * col) / COLS))
      slot.clip.setAttribute('clip-rule', 'evenodd')
      slot.clip.setAttribute('d', polyPath([[-4000, -4000], [4000, -4000], [4000, 4000], [-4000, 4000]]) + polyPath(strip))
    } else {
      slot.clip.removeAttribute('clip-rule')
      slot.clip.setAttribute('d', polyPath(flat))
    }
    // Every patch, far ones first. Those no higher than the table are still hidden under the flat part.
    const r0 = world(0, V / 2)
    const r1 = world(1, V / 2)
    const r2 = world(0, V / 2 + 1)
    const axisSign = (r1[0] - r0[0]) * (r2[1] - r0[1]) - (r1[1] - r0[1]) * (r2[0] - r0[0]) >= 0 ? 1 : -1
    const lx = -0.42
    const ly = -0.6
    const lz = 0.68
    const baseFront = FACE[this.faceClass(p, false)] ?? FACE.right
    const baseBack = FACE[p.style === 'interfacing' ? 'interfacing' : p.side === 'right' ? 'wrong' : 'right']
    const live: { cell: MeshCell; fill: string; d: string; line: string; stroke: string }[] = []
    const shadow: string[] = []
    const kx = 0.13
    const ky = 0.23
    for (const cell of cells) {
      if (sign * (cell.cu - c.hinge) + cell.du < Math.min(...bendStart) - 0.2) continue
      const mapped = cell.pts.map(([u, v]) => map(u, v))
      const [ax, ay, az] = map(cell.cu - cell.du, cell.cv)
      const [bx, by, bz] = map(cell.cu + cell.du, cell.cv)
      const [cx, cy, cz] = map(cell.cu, cell.cv - cell.dv)
      const [dx, dy, dz] = map(cell.cu, cell.cv + cell.dv)
      const t1 = world(bx - ax, by - ay)
      const t2 = world(dx - cx, dy - cy)
      const tu = [t1[0], t1[1], bz - az]
      const tv = [t2[0], t2[1], dz - cz]
      let nx = (tu[1] * tv[2] - tu[2] * tv[1]) * axisSign
      let ny = (tu[2] * tv[0] - tu[0] * tv[2]) * axisSign
      let nz = (tu[0] * tv[1] - tu[1] * tv[0]) * axisSign
      const len = Math.hypot(nx, ny, nz) || 1
      nx /= len
      ny /= len
      nz /= len
      const front = nz >= 0
      if (!front) {
        nx = -nx
        ny = -ny
        nz = -nz
      }
      const light = (nx * lx + ny * ly + nz * lz) / lz
      const k = clamp(0.68 + 0.32 * light, 0.58, 1.08)
      const base = front ? baseFront : baseBack
      const mix = k > 1 ? (k - 1) * 1.5 : 0
      const ch = (n: number) => Math.round(Math.min(255, n * Math.min(k, 1) + (255 - n) * mix))
      const zMean = mapped.reduce((m, q) => m + q[2], 0) / mapped.length
      cell.z = zMean
      const w = mapped.map((q) => world(q[0], q[1]))
      const dPath = polyPath(w)
      if (zMean > 0.001) {
        const cast = mapped.map((q) => {
          const [wx, wy] = world(q[0], q[1])
          return [wx + q[2] * kx, wy + q[2] * ky] as Pt
        })
        // all the same way round, so overlapping patches add up instead of cutting holes
        let area = 0
        cast.forEach((q, i) => {
          const r = cast[(i + 1) % cast.length]
          area += q[0] * r[1] - r[0] * q[1]
        })
        shadow.push(polyPath(area < 0 ? cast.reverse() : cast))
      }
      const line = cell.edges.map((i) => `M${w[i][0].toFixed(3)},${w[i][1].toFixed(3)}L${w[(i + 1) % w.length][0].toFixed(3)},${w[(i + 1) % w.length][1].toFixed(3)}`).join('')
      const color = `rgb(${ch(base[0])},${ch(base[1])},${ch(base[2])})`
      live.push({ cell, fill: color, stroke: color, d: dPath, line })
    }
    if (useGL) {
      if (!crossing) live.length = 0
      this.glFade = crossing ? clamp((1 - c.t) / 0.07) : landing ? clamp((0.999 - c.t) / 0.049) : 1
      if (!c.stays) {
        // what it lands as, under it: exactly the resting cloth
        const back = this.faceClass(p, true)
        const show = landing ? '' : 'none'
        e.ghost.style.display = e.ghostEdge.style.display = show
        if (landing) {
          const mirror = `translate(${2 * c.hinge},0) scale(-1,1)`
          e.ghost.setAttribute('transform', mirror)
          e.ghostEdge.setAttribute('transform', mirror)
          e.ghost.setAttribute('d', e.d)
          e.ghostEdge.setAttribute('d', e.edge.getAttribute('d') ?? e.d)
          e.ghost.setAttribute('class', `fv-face ${back}`)
          e.ghostEdge.setAttribute('class', `fv-edge ${back}`)
        }
      }
      this.queueCloth(p, d, c, map, (u, v) => {
        const st0 = this.startAt(bendStart, v, V, COLS)
        return clamp((sign * (u - c.hinge) - st0) / (S * 0.035) + (1 - clamp(st0 / (S * 0.1))))
      }, world, sign, V, S, axisSign)
    }
    live.sort((a, b) => a.cell.z - b.cell.z)
    while (slot.patches.length < live.length) {
      const fill = svgEl<SVGPathElement>('path', { class: 'fv-patch' }, slot.turnG)
      slot.patches.push({ fill })
    }
    slot.patches.forEach((pa, i) => {
      const q = live[i]
      if (!q) {
        pa.fill.style.display = 'none'
        return
      }
      pa.fill.style.display = ''
      pa.fill.setAttribute('d', q.d)
      pa.fill.setAttribute('fill', q.fill)
      pa.fill.setAttribute('stroke', q.stroke)
    })
    // The outline goes over all the patches, or the next patch would paint over it
    slot.turnG.appendChild(slot.outline)
    slot.outline.setAttribute('d', live.map((q) => q.line).join(''))
    slot.shadow.setAttribute('d', shadow.join(''))
    // Fades with the cloth's height, so it's gone by the time the cloth is down
    slot.shadowG.setAttribute('opacity', clamp(env * 2.2).toFixed(3))
  }

  private startAt(starts: number[], v: number, V: number, cols: number) {
    const f = clamp(v / V) * cols
    const i = Math.min(cols - 1, Math.floor(f))
    return starts[i] + (starts[i + 1] - starts[i]) * (f - i)
  }

  /** The piece's own cloth as an image, one per side, with its outline cut out of transparency */
  private clothTextures(p: PieceState, d: ScenePiece) {
    const gl = clothGL()!
    const back = p.style === 'interfacing' ? 'interfacing' : p.side === 'right' ? 'wrong' : 'right'
    const front = this.faceClass(p, false)
    const key = `${d.key}|${front}`
    const hit = this.clothTex.get(key)
    if (hit) return hit
    const paint = (face: string) => {
      const big = Math.max(d.w, d.h)
      const scale = Math.min(1600 / big, Math.max(this.s * 2.4, 6))
      const c = document.createElement('canvas')
      c.width = Math.ceil(d.w * scale)
      c.height = Math.ceil(d.h * scale)
      const g = c.getContext('2d')!
      g.scale(scale, scale)
      const cmds = outlineCommands({ ...d.o, hemCurve: p.hem }, d.lineX)
      const path = new Path2D(pathOf(cmds))
      const openPath = new Path2D(pathOf(d.o.onFold ? cmds.filter((q) => q[0] !== 'Z') : cmds))
      g.save()
      g.clip(path)
      const [r, gg, b] = FACE[face] ?? FACE.right
      g.fillStyle = `rgb(${r},${gg},${b})`
      g.fillRect(0, 0, d.w, d.h)
      g.restore()
      g.strokeStyle = 'rgba(46,38,28,.34)'
      g.lineWidth = 1 / this.s
      g.stroke(openPath)
      return c
    }
    const made = { front: gl.texture(paint(front)), back: gl.texture(paint(back)) }
    this.clothTex.set(key, made)
    return made
  }

  /** The cloth past the fold line as a fine grid; its shape and slope are worked out for each corner */
  private queueCloth(p: PieceState, d: ScenePiece, c: Curl, map: (u: number, v: number) => [number, number, number], liftOf: (u: number, v: number) => number, world: (a: number, b: number) => Pt, sign: number, V: number, S: number, orient: number) {
    const NU = c.frame ? 14 : 72
    const NV = c.frame ? 70 : 40
    const key = `${d.key}|${c.axis}|${c.hinge}|${c.far}|${c.id ?? ''}`
    let grid = this.grids.get(key)
    const count = (NU + 1) * (NV + 1)
    if (!grid) {
      const uvs = new Float32Array(count * 2)
      const indices = new Uint16Array(NU * NV * 6)
      for (let i = 0; i <= NU; i++) {
        for (let j = 0; j <= NV; j++) {
          const n = i * (NV + 1) + j
          const u = c.hinge + (sign * S * i) / NU
          const v = (V * j) / NV
          const [x, y] = world(u, v)
          uvs[n * 2] = x / d.w
          uvs[n * 2 + 1] = y / d.h
        }
      }
      let k = 0
      for (let i = 0; i < NU; i++) {
        for (let j = 0; j < NV; j++) {
          const a = i * (NV + 1) + j
          const b = a + NV + 1
          indices[k++] = a; indices[k++] = b; indices[k++] = a + 1
          indices[k++] = b; indices[k++] = b + 1; indices[k++] = a + 1
        }
      }
      grid = { uvs, indices, pos: new Float32Array(count * 3), nor: new Float32Array(count * 3), lift: new Float32Array(count) }
      this.grids.set(key, grid)
    }
    const { pos, nor, lift } = grid
    for (let i = 0; i <= NU; i++) {
      const u = c.hinge + (sign * S * i) / NU
      for (let j = 0; j <= NV; j++) {
        const v = (V * j) / NV
        const n = i * (NV + 1) + j
        const [a, b, z] = map(u, v)
        const [x, y] = world(a, b)
        pos[n * 3] = x
        pos[n * 3 + 1] = y
        pos[n * 3 + 2] = z
        lift[n] = liftOf(u, v)
      }
    }
    // Slope at each corner, from its neighbours. Flat cloth faces the camera (+z).
    const axisSign = orient * sign
    for (let i = 0; i <= NU; i++) {
      const i0 = Math.max(0, i - 1)
      const i1 = Math.min(NU, i + 1)
      for (let j = 0; j <= NV; j++) {
        const j0 = Math.max(0, j - 1)
        const j1 = Math.min(NV, j + 1)
        const a = i0 * (NV + 1) + j
        const b = i1 * (NV + 1) + j
        const e = i * (NV + 1) + j0
        const f = i * (NV + 1) + j1
        const ux = pos[b * 3] - pos[a * 3]
        const uy = pos[b * 3 + 1] - pos[a * 3 + 1]
        const uz = pos[b * 3 + 2] - pos[a * 3 + 2]
        const vx = pos[f * 3] - pos[e * 3]
        const vy = pos[f * 3 + 1] - pos[e * 3 + 1]
        const vz = pos[f * 3 + 2] - pos[e * 3 + 2]
        const n = i * (NV + 1) + j
        nor[n * 3] = (uy * vz - uz * vy) * axisSign
        nor[n * 3 + 1] = (uz * vx - ux * vz) * axisSign
        nor[n * 3 + 2] = (ux * vy - uy * vx) * axisSign
      }
    }
    const tex = this.clothTextures(p, d)
    this.glDraws.push({
      positions: pos,
      normals: nor,
      uvs: grid.uvs,
      lifts: lift,
      indices: grid.indices,
      front: tex.front,
      back: tex.back,
      scale: this.camK,
      offsetX: this.camK * (p.x + p.ox) + this.camE,
      offsetY: this.camK * (p.y + p.oy) + this.camF,
      center: [d.w / 2, d.h / 2],
      loom: 0.05 / Math.max(S, 1),
      depth: 0.4 / Math.max(S, 1),
      alpha: p.op * this.glFade,
    })
    void V
  }

  private flushCloth() {
    const gl = clothGL()
    if (!gl || !this.glCtx || !this.glCanvas) return
    if (!this.glDraws.length) {
      if (this.glDrew) {
        this.glCtx.clearRect(0, 0, this.glCanvas.width, this.glCanvas.height)
        this.glDrew = false
      }
      return
    }
    gl.render(this.glDraws, this.W, this.H, Math.min(2, window.devicePixelRatio || 1), this.glCtx)
    this.glDraws = []
    this.glDrew = true
  }

  private drawPiece(p: PieceState, st: SceneState) {
    const e = this.els[p.key]
    const d = this.sp(p.key)
    const visible = p.op > 0.002
    const show = visible ? '' : 'none'
    e.g.style.display = e.shadowG.style.display = show
    if (!visible) return
    const curl = this.curlOf(p, d)
    const banded = this.bandCurls(p, d)
    // Lifted cloth sways: its edges move softly in the air. Paper stays stiff.
    const sway = !curl && p.style !== 'paper' && p.lift > 3 && !p.rot ? clamp(p.lift / 60) : 0
    const hole = p.holed && d.hole ? ' ' + pathOf(d.hole) : ''
    let path: string
    if (sway) {
      const t = this.now / 1000
      const big = Math.max(d.w, d.h)
      const amp = big * 0.013 * sway
      path = polyPath(this.outlinePoints(d, p.hem).map(([x, y]) => [
        x + amp * Math.sin((y / big) * 7 + t * 2.1),
        y + amp * 1.25 * Math.sin((x / big) * 6.3 + t * 2.6 + 1),
      ]))
    } else path = pathOf(outlineCommands({ ...d.o, hemCurve: p.hem }, d.lineX)) + hole
    if (path !== e.d) {
      e.d = path
      for (const el of [e.fill, e.edge, e.far, e.near, e.contact]) el.setAttribute('d', path)
      // A half cut on the fold has no edge along the fold: it carries on into its other half
      if (d.o.onFold && !sway) e.edge.setAttribute('d', pathOf(outlineCommands({ ...d.o, hemCurve: p.hem }, d.lineX).filter((q) => q[0] !== 'Z')))
    }
    const m = this.matrix(p, d)
    const finished = !curl && p.rot ? Math.cos((p.rot.deg * Math.PI) / 180) : 1
    const flipped = finished < 0
    const face = this.faceClass(p, flipped)
    if (face !== e.state) {
      e.state = face
      this.setFace(e, face)
      e.paper.style.display = face === 'paper' ? '' : 'none'
    }
    const transform = mat(m)
    e.g.setAttribute('transform', transform)
    const op = p.op
    e.g.setAttribute('opacity', op.toFixed(3))
    const i = this.sorted.indexOf(d)
    if (!curl) e.ghost.style.display = e.ghostEdge.style.display = 'none'
    // Each fold cuts its part away from the flat cloth and draws what's over it
    const active: { curl: Curl; over: boolean; coveredBy?: number }[] = [...(curl ? [{ curl, over: true }] : []), ...banded]
    for (let k = 0; k < 6; k++) {
      const q = active[k]
      if (!q) {
        const old = e.slots[k]
        if (old?.used) {
          old.used = false
          old.shadowG.style.display = old.turnG.style.display = 'none'
          e.wholeNest[k].removeAttribute('clip-path')
          e.shadowNest[k].removeAttribute('clip-path')
        }
        continue
      }
      let sl = e.slots[k]
      if (!sl) {
        const clipId = `${this.id}-flat-${i}-${k}`
        const clip = svgEl<SVGPathElement>('path', {}, svgEl('clipPath', { id: clipId }, e.defs))
        const shadowG = svgEl<SVGGElement>('g', { filter: `url(#${this.id}-soft)` }, e.g)
        const shadow = svgEl<SVGPathElement>('path', { class: 'fv-turnshadow' }, shadowG)
        const turnG = svgEl<SVGGElement>('g', {}, e.g)
        const outline = svgEl<SVGPathElement>('path', { class: 'fv-patch-edge', fill: 'none' }, turnG)
        sl = e.slots[k] = { clip, clipId, shadowG, shadow, turnG, patches: [], outline, used: false }
      }
      if (!sl.used) {
        sl.used = true
        e.wholeNest[k].setAttribute('clip-path', `url(#${sl.clipId})`)
        e.shadowNest[k].setAttribute('clip-path', `url(#${sl.clipId})`)
      }
      sl.shadowG.style.display = sl.turnG.style.display = q.over ? '' : 'none'
      if (q.coveredBy != null && e.slots[q.coveredBy + (curl ? 1 : 0)]) sl.turnG.setAttribute('clip-path', `url(#${e.slots[q.coveredBy + (curl ? 1 : 0)].clipId})`)
      else sl.turnG.removeAttribute('clip-path')
      this.drawCurl(p, d, e, q.curl, sl)
    }
    const folding = !!curl || banded.some((q) => q.over && q.curl.t < 0.995)
    // Shadows: three of them, as under real light from the top left. Tight where the cloth touches,
    // a soft halo around it, and one that drifts further and softer as it lifts.
    const L = curl ? 0 : p.lift
    // Just landed from a turn: the piece's own shadows grow in, no jump
    if (curl) e.wasCurl = true
    else if (e.wasCurl) {
      e.wasCurl = false
      e.landedAt = this.now
    }
    if (e.landedAt != null && (this.now < e.landedAt || !p.rot)) e.landedAt = undefined
    const landing = e.landedAt != null ? clamp((this.now - e.landedAt) / 450) : 1
    const k = (p.style === 'paper' ? 0.65 : 1) * landing
    if (d.flush) {
      const flushed = !curl && !!p.rot
      if (flushed && !e.flushClip) {
        const cid = `${this.id}-fl-${i}`
        e.flushClip = svgEl<SVGRectElement>('rect', { x: -4000, y: -4000, width: 4000 + d.x + p.ox, height: 8000 }, svgEl('clipPath', { id: cid }, e.defs))
      }
      if (flushed) e.shadowG.setAttribute('clip-path', `url(#${this.id}-fl-${i})`)
      else e.shadowG.removeAttribute('clip-path')
    }
    const inPlace = active.length > 0
    const offset = (px: number, py: number) => {
      const ex = m.a >= 0 ? px : -px
      if (inPlace) return `translate(${(ex / this.s).toFixed(3)},${(py / this.s).toFixed(3)})`
      return mat({ ...m, e: m.e + px / this.s, f: m.f + py / this.s })
    }
    if (inPlace) e.shadowG.setAttribute('transform', transform)
    else e.shadowG.removeAttribute('transform')
    e.contact.setAttribute('transform', offset(0.5, 1))
    e.near.setAttribute('transform', offset(1 + L * 0.1, 2.5 + L * 0.2))
    e.far.setAttribute('transform', offset(3 + L * 0.3, 7 + L * 0.62))
    e.contact.setAttribute('opacity', (clamp(1 - L * 0.04) * op * k).toFixed(3))
    e.near.setAttribute('opacity', (clamp(1 - L * 0.012, 0.25, 1) * op * k).toFixed(3))
    e.far.setAttribute('opacity', (clamp(0.5 + L * 0.018, 0.5, 1) * op * k).toFixed(3))
    // Label, kept readable when the piece is the other way round
    const labelled = d.labelled && !p.moving && !folding && !st.pins.some((q) => q.drop > 0 && q.out < 1)
    e.labelG.style.display = labelled ? '' : 'none'
    if (labelled) {
      e.labelG.setAttribute('opacity', landing.toFixed(3))
      const lx = d.labelX ?? d.w / 2
      const ly = d.h * 0.46
      const size = 1 / (this.s * this.camZ)
      // readable whichever way round the piece is, and the same size at any zoom
      e.labelG.setAttribute('transform', `translate(${lx.toFixed(2)},${ly.toFixed(2)}) scale(${(size * (flipped ? -1 : 1)).toFixed(5)},${size.toFixed(5)})`)
    }
  }

  private drawLines(st: SceneState) {
    const buckets: Record<string, string[]> = {}
    const zs = this.sorted.map((sp) => ({ key: sp.key, z: st.p[sp.key].z, vis: st.p[sp.key].op > 0.002 }))
    const slotFor = (z: number) => {
      let k = zs[0].key
      for (const q of zs) if (q.z <= z) k = q.key
      return k
    }
    const put = (z: number, html: string) => (buckets[slotFor(z)] ??= []).push(html)
    const wrap = (on: string, inner: string, op: number, clip = false) => {
      const p = st.p[on]
      const d = this.sp(on)
      return `<g transform="${mat(this.matrix(p, d))}" opacity="${op.toFixed(3)}"><g${clip ? ` clip-path="url(#${this.id}-pc-${this.sorted.indexOf(d)})"` : ''}><g transform="translate(${-d.x},${-d.y})">${inner}</g></g></g>`
    }
    for (const l of st.lines) {
      if (l.op <= 0 || !st.p[l.on]) continue
      const kind = l.kind
      if (kind === 'button') {
        const [bx, by] = l.pts[0]
        const r = 5 / (this.s * this.camZ)
        const g = r * 0.36
        const button = `<g transform="translate(${bx.toFixed(2)},${by.toFixed(2)}) scale(${(0.6 + 0.4 * l.p).toFixed(3)})"><circle class="fv-bt-sh" cx="${r * 0.12}" cy="${r * 0.24}" r="${r}"/><circle class="fv-bt" r="${r}"/><circle class="fv-bt-rim" r="${r * 0.74}"/>${[[-g, -g], [g, -g], [-g, g], [g, g]].map(([u, v]) => `<circle class="fv-bt-hole" cx="${u}" cy="${v}" r="${r * 0.12}"/>`).join('')}<path class="fv-bt-thread" d="M${-g},${-g}L${g},${g}M${g},${-g}L${-g},${g}"/></g>`
        put(st.p[l.on].z + 0.7, wrap(l.on, button, l.op))
        continue
      }
      const shaped = stitchPath(upTo(l.pts, l.p), kind, this.s * this.camZ)
      const pts = shaped.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
      const base = `<polyline class="fv-line ${kind}" points="${pts}"/>`
      const shadow = kind === 'overlock' ? `<polyline class="fv-line overlock-edge" points="${upTo(l.pts, l.p).map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}"/>` : ''
      const mid = l.pts.reduce((m, q) => [m[0] + q[0] / l.pts.length, m[1] + q[1] / l.pts.length], [0, 0])
      const text = l.kind === 'fold' ? `<text class="fv-foldtext" font-size="${(10 / this.s).toFixed(3)}" transform="translate(${(mid[0] - 5 / this.s).toFixed(2)},${mid[1].toFixed(2)}) rotate(-90)" text-anchor="middle">Fold</text>` : ''
      // A join on top of a piece has to stay in sight: it sits on the upper piece, not hidden under it
      const joined = l.id.startsWith('old-') ? st.p[l.id.slice(4)] : undefined
      put(joined ? joined.z + 0.6 : l.z, wrap(l.on, shadow + base + text, l.op * st.p[l.on].op))
    }
    for (const sp of this.sorted) {
      const e = this.els[sp.key]
      const html = (buckets[sp.key] ?? []).join('')
      if (html !== e.html) {
        e.html = html
        e.slot.innerHTML = html
      }
    }
  }

  /** Pins lie across the seam: the head just past the raw edge, the shaft under the cloth for a stretch, the point out */
  private drawPins(st: SceneState) {
    const z = this.camZ
    const k = 44 / (3.4 * this.s * z)
    const L = 3.4 * k
    const a = -L / 2
    const r0 = 3.4 / (this.s * z)
    const out: string[] = []
    for (const q of st.pins) {
      if (q.drop <= 0 || q.out >= 1) continue
      const p = st.p[q.on]
      const d = this.sp(q.on)
      const m = this.matrix(p, d)
      const x = m.a * (q.x - d.x) + m.e
      const y = m.d * (q.y - d.y) + m.f
      const h = ((1 - q.drop) * 46 + q.out * 40) / (this.s * z)
      const sc = 1 + ((1 - q.drop) + q.out) * 0.22
      const op = clamp(q.drop * 2.5) * (1 - q.out) * p.op
      const deg = (q.ang * 180) / Math.PI
      const sh = (1.2 + h * this.s * z * 0.4) / (this.s * z)
      const shaft = `M${a},0 H${(a + L * 0.46).toFixed(3)}`
      const under = `M${(a + L * 0.46).toFixed(3)},0 H${(a + L * 0.72).toFixed(3)}`
      const tip = `M${(a + L * 0.72).toFixed(3)},0 H${(L / 2).toFixed(3)}`
      out.push(`<g opacity="${op.toFixed(3)}">
        <g transform="translate(${(x + sh * 0.6).toFixed(3)},${(y + sh).toFixed(3)}) rotate(${deg.toFixed(2)})" class="fv-pinsh"><path d="${shaft}"/><path d="${tip}"/><circle cx="${a}" r="${r0.toFixed(3)}"/></g>
        <g transform="translate(${x.toFixed(3)},${(y - h).toFixed(3)}) rotate(${deg.toFixed(2)}) scale(${sc.toFixed(3)})" class="fv-pin">
          <path d="${shaft}" class="sh"/><path d="${shaft}" class="hi"/><path d="${under}" class="un"/><path d="${tip}" class="sh"/><path d="${tip}" class="hi"/>
          <circle cx="${a}" r="${r0.toFixed(3)}" class="hd"/><circle cx="${(a - r0 * 0.3).toFixed(3)}" cy="${(-r0 * 0.34).toFixed(3)}" r="${(r0 * 0.24).toFixed(3)}" class="gl"/>
        </g></g>`)
    }
    const html = out.join('')
    this.top.innerHTML = html
  }

  /** The tool of the moment. It slides in just before its beat and slides away just after it, rather than popping. */
  private drawTool(st: SceneState, time: number) {
    const IN = 420
    const OUT = 520
    let t: Tool | null = st.tool
    let presence = 1
    if (!t) {
      for (const q of this.poses) {
        if (time >= q.end && time < q.end + OUT) {
          t = q.last
          presence = 1 - clamp((time - q.end) / OUT)
        } else if (time >= q.start - IN && time < q.start) {
          t = q.first
          presence = clamp((time - (q.start - IN)) / IN)
        }
      }
    }
    if (!t || !st.p[t.on]) {
      this.toolEl.style.display = this.toolSh.style.display = this.toolNear.style.display = this.under.style.display = 'none'
      this.angle = null
      return
    }
    const e = ease(presence)
    const z = this.camZ
    const p = st.p[t.on]
    const d = this.sp(t.on)
    const m = this.matrix(p, d)
    const x = m.a * (t.x - d.x) + m.e
    const y = m.d * (t.y - d.y) + m.f
    const isMachine = t.kind === 'machine'
    const size = TOOL_SIZE[t.kind]
    const k = (Math.min(this.W, this.H) * size.share) / (size.cm * this.s * z)
    // Turning follows the path smoothly, so corners never snap
    let target = t.ang
    if (isMachine) target = 0
    const dt = time - this.lastTime
    if (this.angle == null || dt <= 0 || dt > 200) this.angle = target
    else {
      let diff = target - this.angle
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      this.angle += diff * (1 - Math.exp(-dt / 90))
    }
    const deg = (this.angle * 180) / Math.PI
    // Slides back along its own length (a machine lifts up out of frame)
    const slide = (1 - e) * (Math.min(this.W, this.H) * 0.3) / (this.s * z)
    const sx = isMachine ? 0 : -Math.cos(this.angle) * slide
    const sy = isMachine ? -slide : -Math.sin(this.angle) * slide
    const tf = `translate(${(x + sx).toFixed(3)},${(y + sy).toFixed(3)}) rotate(${deg.toFixed(2)}) scale(${k.toFixed(4)})`
    const markup = toolMarkup(t.kind, t.phase)
    this.toolEl.style.display = this.toolSh.style.display = this.toolNear.style.display = ''
    this.toolEl.innerHTML = markup
    this.toolEl.setAttribute('transform', tf)
    this.toolEl.setAttribute('opacity', e.toFixed(3))
    const unit = 1 / (this.s * z)
    const place = (dx: number, dy: number) => `translate(${(x + sx + dx * unit).toFixed(3)},${(y + sy + dy * unit).toFixed(3)}) rotate(${deg.toFixed(2)}) scale(${k.toFixed(4)})`
    if (isMachine) {
      // A machine stands on the table: a tight dark line where it stands, a wide pool thrown away from the light
      this.toolSh.innerHTML = `<path d="M-5,-2.5 H26 Q33,-2.5 33,1 Q33,3.6 26,3.6 H-5 Q-8,3.6 -8,.5 Q-8,-2.5 -5,-2.5 Z"/>`
      this.toolSh.setAttribute('transform', `translate(${(x + sx + 7 * unit).toFixed(3)},${(y + sy + 10 * unit).toFixed(3)}) scale(${k.toFixed(4)})`)
      this.toolNear.innerHTML = `<rect x="23.6" y="-.7" width="8" height="1" rx=".4"/><ellipse cx=".7" cy=".15" rx="2.7" ry=".36"/>`
      this.toolNear.setAttribute('transform', `translate(${(x + sx + unit).toFixed(3)},${(y + sy + unit).toFixed(3)}) scale(${k.toFixed(4)})`)
    } else {
      // Lying on the cloth: contact shadow plus a wider, softer one away from the light
      const lift = t.kind === 'iron' ? 1 : t.kind === 'scissors' ? 1.5 : 0.8
      this.toolSh.innerHTML = markup
      this.toolSh.setAttribute('transform', place(7 * lift, 13 * lift))
      this.toolNear.innerHTML = markup
      this.toolNear.setAttribute('transform', place(1.2, 2.2))
    }
    this.toolSh.setAttribute('opacity', (e * (isMachine ? 0.62 : 1)).toFixed(3))
    this.toolNear.setAttribute('opacity', e.toFixed(3))
    if (isMachine) {
      this.under.style.display = ''
      this.under.innerHTML = machineFrontBed()
      this.under.setAttribute('transform', `translate(${(x + sx).toFixed(3)},${(y + sy).toFixed(3)}) rotate(${deg.toFixed(2)}) scale(${k.toFixed(4)})`)
      this.under.setAttribute('opacity', e.toFixed(3))
    } else this.under.style.display = 'none'
  }

  private hasFrontMachine() {
    return this.poses.some((q) => q.first.kind === 'machine')
  }

  private drawCamera(st: SceneState) {
    const z = st.cam.z
    this.camZ = z
    const fx = this.ox + st.cam.fx * this.s
    const fy = this.oy + st.cam.fy * this.s
    const a = clamp((z - 1) / 0.25)
    const k = z * this.s
    this.camK = k
    this.camE = z * (this.ox - fx) + fx + (this.W / 2 - fx) * a
    this.camF = z * (this.oy - fy) + fy + (this.H / 2 - fy) * a + (this.hasFrontMachine() ? this.H * 0.17 * a : 0)
    this.cam.setAttribute('transform', mat({ a: k, d: k, e: this.camE, f: this.camF }))
  }

  render(time: number) {
    if (!this.W || !this.cam) return
    this.now = time
    const st = stateAt(this.scene, time)
    this.drawCamera(st)
    for (const p of Object.values(st.p)) this.drawPiece(p, st)
    this.drawLines(st)
    this.drawPins(st)
    this.drawTool(st, time)
    this.flushCloth()
    this.lastTime = time
  }
}

