/**
 * Draws a guide scene (lib/guide-scene.ts) into a DOM element, frame by frame, with 3D CSS
 * transforms: the cutting mat, the fabric pieces, stitches, pins and the tools. Plain DOM, no
 * React, so the same code runs in the app and in the animation lab.
 */
import { commandsToPath, outlineCommands } from './piece-outline'
import { RULES, clamp, stateAt, upTo, type PieceState, type Scene, type ScenePiece, type SceneState, type Tool } from './guide-scene'

type Els = { sh: HTMLDivElement; pc: HTMLDivElement; f1: HTMLDivElement; f2: HTMLDivElement; strip: HTMLDivElement; s1: HTMLDivElement; s2: HTMLDivElement; lns: HTMLDivElement; pins: HTMLDivElement[]; cache: string; lcache: string }

export class SceneView {
  private W = 0
  private H = 0
  private s = 1
  private ox = 0
  private oy = 0
  private cam!: HTMLDivElement
  private table!: HTMLDivElement
  private defs!: SVGDefsElement
  private els: Record<string, Els> = {}
  private toolEl!: HTMLDivElement
  private toolSh!: HTMLDivElement
  private uid = 0
  private time = 0

  constructor(private root: HTMLDivElement, private scene: Scene, private id: string) {
    this.build()
  }

  destroy() {
    this.root.innerHTML = ''
  }

  /** Lays the scene out for the stage's size */
  build() {
    const r = this.root.getBoundingClientRect()
    this.W = r.width
    this.H = r.height
    if (!this.W || !this.H) return
    const [x0, y0, x1, y1] = this.scene.frame
    const fw = x1 - x0
    const fh = y1 - y0
    const cos = Math.cos((RULES.tilt * Math.PI) / 180)
    this.s = Math.min((this.W * 0.86) / fw, (this.H * 0.8) / (fh * cos + fh * 0.06))
    this.ox = this.W / 2 - (x0 + fw / 2) * this.s
    this.oy = this.H / 2 - (y0 + fh / 2) * this.s
    const s = this.s
    this.root.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs></defs></svg><div class="gs-cam"><div class="gs-table" style="transform:rotateX(${RULES.tilt}deg)"><div class="gs-mat"></div></div></div>`
    this.defs = this.root.querySelector('defs')!
    this.cam = this.root.querySelector('.gs-cam')!
    this.table = this.root.querySelector('.gs-table')!
    const mat = this.root.querySelector<HTMLDivElement>('.gs-mat')!
    const g5 = 5 * s
    mat.style.backgroundSize = `${g5}px ${g5}px, ${g5}px ${g5}px, ${s}px ${s}px, ${s}px ${s}px`
    mat.style.backgroundPosition = `${this.ox + this.W * 0.6}px ${this.oy + this.H * 0.6}px`
    this.buildDefs()
    this.els = {}
    for (const p of this.scene.pieces) {
      const sh = document.createElement('div')
      sh.className = 'gs-sh'
      const pc = document.createElement('div')
      pc.className = 'gs-pc'
      pc.innerHTML = '<div class="gs-face f1"></div><div class="gs-face gs-back f2"></div><div class="gs-strip"><div class="gs-face s1"></div><div class="gs-face gs-back s2"></div></div><div class="gs-lns"></div>'
      this.table.append(sh, pc)
      const q = <T extends HTMLElement>(c: string) => pc.querySelector<T>(c)!
      this.els[p.key] = { sh, pc, f1: q('.f1'), f2: q('.f2'), strip: q('.gs-strip'), s1: q('.s1'), s2: q('.s2'), lns: q('.gs-lns'), pins: [], cache: '', lcache: '' }
    }
    this.toolSh = document.createElement('div')
    this.toolSh.className = 'gs-tool'
    this.toolEl = document.createElement('div')
    this.toolEl.className = 'gs-tool'
  }

  /** Cloth: plain weave and grain at real size, soft wrinkles that catch the light, fuzzy cut edges */
  private buildDefs() {
    const s = this.s
    const t = Math.max(1.6, 0.14 * s)
    const id = this.id
    this.defs.innerHTML = `
      <pattern id="${id}-wv" width="${t}" height="${t}" patternUnits="userSpaceOnUse"><path d="M0,${t / 2} H${t} M${t / 2},0 V${t}" fill="none" stroke="rgba(40,34,26,.07)" stroke-width="${Math.max(0.4, t * 0.22)}"/></pattern>
      <pattern id="${id}-wvw" width="${t}" height="${t}" patternUnits="userSpaceOnUse"><path d="M0,${t / 2} H${t} M${t / 2},0 V${t}" fill="none" stroke="rgba(40,34,26,.04)" stroke-width="${Math.max(0.4, t * 0.22)}"/></pattern>
      <pattern id="${id}-tw" width="${t}" height="${t}" patternUnits="userSpaceOnUse"><path d="M0,0 H${t / 2} M${t / 2},${t / 2} H${t}" stroke="rgba(255,255,255,.10)" stroke-width="${Math.max(0.4, t * 0.2)}"/></pattern>
      <linearGradient id="${id}-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#2a1a0c" stop-opacity=".10"/></linearGradient>
      <linearGradient id="${id}-foldhl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a0c" stop-opacity="0"/><stop offset=".42" stop-color="#2a1a0c" stop-opacity=".10"/><stop offset=".5" stop-color="#fff" stop-opacity=".38"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6E8EB"/><stop offset=".5" stop-color="#B7BCC2"/><stop offset="1" stop-color="#8F959C"/></linearGradient>
      <linearGradient id="${id}-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCFAF6"/><stop offset=".6" stop-color="#EDE7DC"/><stop offset="1" stop-color="#D6CEC0"/></linearGradient>
      <linearGradient id="${id}-ironbody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A453F"/><stop offset="1" stop-color="#211E1A"/></linearGradient>
      <linearGradient id="${id}-chalk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFDF8"/><stop offset="1" stop-color="#DDD6C8"/></linearGradient>
      <radialGradient id="${id}-ball" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#8C857C"/><stop offset=".35" stop-color="#2A2520"/><stop offset="1" stop-color="#0E0C0A"/></radialGradient>
      <filter id="${id}-cloth" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="${(1 / (16 * s)).toFixed(5)}" numOctaves="3" seed="7" result="folds"/>
        <feDiffuseLighting in="folds" surfaceScale="${(0.6 * s).toFixed(2)}" diffuseConstant="1" lighting-color="#fff" result="light"><feDistantLight azimuth="235" elevation="62"/></feDiffuseLighting>
        <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1.14" k2="0" k3="0" k4="-0.02" result="lit"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves="1" seed="3" result="fray"/>
        <feDisplacementMap in="lit" in2="fray" scale="${Math.min(2.4, 0.9 + s * 0.08).toFixed(2)}" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 .18  0 0 0 0 .12  0 0 0 0 .06  0 0 0 -1.1 .62"/></filter>
      <filter id="${id}-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${Math.max(1, s * 0.22).toFixed(2)}"/></filter>`
  }

  private sp(key: string): ScenePiece {
    return this.scene.pieces.find((p) => p.key === key)!
  }

  private faceSVG(p: PieceState, isBack: boolean, withLabel: boolean, foldY: number | null) {
    const d = this.sp(p.key)
    const s = this.s
    const W = d.w * s
    const H = d.h * s
    // Fabric a piece was cut from has its shape missing
    const hole = p.holed && d.hole ? ' ' + commandsToPath(d.hole, { scale: s, flipW: isBack ? W : undefined }) : ''
    const path = commandsToPath(outlineCommands({ ...d.o, hemCurve: p.hem }, d.lineX), { scale: s, flipW: isBack ? W : undefined }) + hole
    const side = isBack ? (p.side === 'right' ? 'wrong' : 'right') : p.side
    const id = `${this.id}-c${++this.uid}`
    const big = `x="-40" y="-40" width="${W + 80}" height="${H + 80 + p.hem * s * 2}"`
    const fs = clamp(s * 2.1, 10, 16)
    const label = withLabel ? `<text x="${W / 2}" y="${H * 0.46 + fs / 3}" text-anchor="middle" font-weight="600" font-size="${fs}" style="fill:var(--gs-thread)" opacity=".7">${d.label}</text>` : ''
    // Paper stays crisp: it's the printed pattern, with its grain line
    if (p.style === 'paper') {
      const gx = isBack ? W - d.lineX * s : d.lineX * s
      const y1 = H * 0.22
      const y2 = H * 0.78
      const a = Math.max(5, s * 1.2)
      return `<svg width="${W}" height="${H}" overflow="visible">
        <path d="${path}" fill="#FFFDF8" fill-opacity=".9" stroke="#6E5A47" stroke-width="1" stroke-dasharray="7 4"/>
        <path d="M${gx},${y1} L${gx},${y2} M${gx - a / 2},${y1 + a} L${gx},${y1} L${gx + a / 2},${y1 + a} M${gx - a / 2},${y2 - a} L${gx},${y2} L${gx + a / 2},${y2 - a}" fill="none" stroke="#6E5A47" stroke-width="1.2"/>
        <text x="${gx + 8}" y="${H * 0.5}" font-size="${clamp(s * 1.9, 9, 13)}" fill="#6E5A47">${d.label}</text>
      </svg>`
    }
    let base: string
    let fop = 1
    let weave = ''
    let outline = ''
    if (p.style === 'interfacing') {
      base = 'var(--gs-interf)'
      fop = 0.86
      outline = `<path d="${path}" fill="none" style="stroke:var(--gs-edge)" stroke-width=".8" stroke-dasharray="1.5 2.5" opacity=".6"/>`
    } else {
      base = side === 'right' ? 'var(--gs-right)' : 'var(--gs-wrong)'
      weave = `<rect ${big} fill="url(#${this.id}-${side === 'right' ? 'wv' : 'wvw'})"/><rect ${big} fill="url(#${this.id}-tw)"/>`
    }
    const tint = p.tint > 0 && side === 'wrong' && p.style === 'fabric' ? `<rect ${big} style="fill:var(--gs-interf)" opacity="${(p.tint * 0.7).toFixed(2)}"/>` : ''
    // A fold is rounded, not a crease: a soft highlight along it
    const band = foldY != null ? `<rect x="-40" y="${foldY - 0.8 * s}" width="${W + 80}" height="${1.6 * s}" fill="url(#${this.id}-foldhl)"/>` : ''
    return `<svg width="${W}" height="${H}" overflow="visible">
      <defs><clipPath id="${id}"><path d="${path}" clip-rule="evenodd"/></clipPath></defs>
      <g filter="url(#${this.id}-cloth)">
        <path d="${path}" fill-rule="evenodd" style="fill:${base}" fill-opacity="${fop}"/>
        <g clip-path="url(#${id})">
          ${weave}${tint}
          <rect ${big} fill="url(#${this.id}-sheen)"/>
          <rect ${big} filter="url(#${this.id}-grain)" opacity="${p.style === 'interfacing' ? 0.9 : 0.55}"/>
          <path d="${path}" fill="none" stroke="#3a2614" stroke-width="${Math.max(3, s * 0.5).toFixed(1)}" opacity=".22" filter="url(#${this.id}-soft)"/>
          ${band}
        </g>
      </g>
      ${outline}${label}
    </svg>`
  }

  private faceOp(p: PieceState, st: SceneState) {
    return p.op * (RULES.dimEarlier && st.focus && !st.focus.includes(p.key) ? 0.5 : 1)
  }

  private drawPiece(p: PieceState, st: SceneState) {
    const e = this.els[p.key]
    const d = this.sp(p.key)
    const s = this.s
    const W = d.w * s
    const H = d.h * s
    const visible = p.op > 0.002
    e.pc.style.visibility = e.sh.style.visibility = visible ? 'visible' : 'hidden'
    if (!visible) return
    const showLabel = !p.moving && this.sp(p.key).labelled
    const key = [p.hem.toFixed(2), p.side, p.tint.toFixed(2), p.style, showLabel, s.toFixed(3), p.fold ? p.fold.y : '-', p.holed].join('|')
    if (key !== e.cache) {
      e.cache = key
      e.f1.innerHTML = this.faceSVG(p, false, showLabel, null)
      e.f2.innerHTML = this.faceSVG(p, true, showLabel, null)
      const fy = p.fold ? p.fold.y * s : null
      e.s1.innerHTML = this.faceSVG(p, false, false, fy)
      e.s2.innerHTML = this.faceSVG(p, true, false, fy)
      const hole = p.holed && d.hole ? ' ' + commandsToPath(d.hole, { scale: s }) : ''
      e.sh.innerHTML = `<svg width="${W}" height="${H}" overflow="visible"><path d="${commandsToPath(outlineCommands({ ...d.o, hemCurve: p.hem }, d.lineX), { scale: s })}${hole}" fill-rule="evenodd" fill="#1a120a"/></svg>`
    }
    const X = this.ox + (p.x + p.ox) * s
    const Y = this.oy + (p.y + p.oy) * s
    const Z = p.z + p.lift
    let rot = ''
    if (p.rot) {
      e.pc.style.transformOrigin = `${p.rot.o[0] * s}px ${p.rot.o[1] * s}px`
      rot = `rotate${p.rot.axis.toUpperCase()}(${p.rot.deg}deg)`
    }
    // Lifted fabric sways a little in the air
    const sw = clamp(p.lift / 50)
    const ph = this.time / 1000 + p.z
    const sway = sw > 0.01 ? ` rotateX(${(Math.sin(ph * 4.1) * 3.2 * sw).toFixed(2)}deg) rotateY(${(Math.cos(ph * 3.3) * 2.4 * sw).toFixed(2)}deg)` : ''
    e.pc.style.transform = `translate3d(${X}px,${Y}px,${Z}px) ${rot}${sway}`
    const op = String(this.faceOp(p, st))
    for (const f of [e.f1, e.f2, e.s1, e.s2]) f.style.opacity = op
    if (p.fold) {
      const hy = p.fold.y * s
      const big = 9999
      const top = `polygon(-${big}px -${big}px, ${big}px -${big}px, ${big}px ${hy}px, -${big}px ${hy}px)`
      const bottom = `polygon(-${big}px ${hy}px, ${big}px ${hy}px, ${big}px ${big}px, -${big}px ${big}px)`
      const [keep, turn] = p.fold.part === 'below' ? [top, bottom] : [bottom, top]
      e.f1.style.clipPath = e.f2.style.clipPath = keep
      e.s1.style.clipPath = e.s2.style.clipPath = turn
      e.strip.style.display = ''
      e.strip.style.transformOrigin = `50% ${hy}px`
      e.strip.style.transform = `translateZ(0.9px) rotateX(${p.fold.deg}deg)`
    } else {
      e.f1.style.clipPath = e.f2.style.clipPath = ''
      e.strip.style.display = 'none'
    }
    // The shadow on the mat grows softer and further away as the piece lifts or turns
    const turn = p.rot ? Math.abs(Math.sin((p.rot.deg * Math.PI) / 180)) * W * 0.18 : 0
    const L = p.lift + turn
    let shT = `translate3d(${X + L * 0.22 + 1}px,${Y + L * 0.5 + 1.5}px,0.3px)`
    if (p.rot) {
      const c = Math.cos((p.rot.deg * Math.PI) / 180)
      const o = p.rot.o
      shT += ` translate(${o[0] * s}px,${o[1] * s}px) ${p.rot.axis === 'y' ? `scaleX(${c})` : `scaleY(${c})`} translate(${-o[0] * s}px,${-o[1] * s}px)`
    }
    e.sh.style.transform = shT
    e.sh.style.clipPath = p.fold && Math.abs(p.fold.deg) > 90 ? e.f1.style.clipPath : ''
    e.sh.style.filter = `blur(${(1.2 + L * 0.13).toFixed(1)}px)`
    e.sh.style.opacity = String(clamp(0.2 - L * 0.0006, 0.08, 0.2) * p.op * (p.style === 'interfacing' ? 0.6 : 1))
  }

  // Stitches, chalk, pins and tools are drawn inside the piece they're on, so they move, tilt and
  // zoom exactly with it
  private local(p: PieceState, x: number, y: number, z: number): [number, number, number] {
    return [(x - p.x) * this.s, (y - p.y) * this.s, z - p.z]
  }

  private drawLines(st: SceneState) {
    const s = this.s
    for (const [key, e] of Object.entries(this.els)) {
      const p = st.p[key]
      const html = st.lines
        .filter((l) => l.on === key && l.op > 0)
        .map((l) => {
          const pts = upTo(l.pts, l.p)
            .map(([x, y]) => {
              const [a, b] = this.local(p, x, y, 0)
              return `${a.toFixed(1)},${b.toFixed(1)}`
            })
            .join(' ')
          let attrs: string
          if (l.kind === 'stitch') {
            const dl = Math.max(2.6, (RULES.stitch / 10) * s)
            attrs = `style="stroke:var(--gs-thread)" stroke-width="${Math.max(1.4, s * 0.17).toFixed(1)}" stroke-dasharray="${dl.toFixed(1)} ${(dl * 0.75).toFixed(1)}" stroke-linecap="round"`
          } else if (l.kind === 'seam') attrs = `style="stroke:var(--gs-edge)" stroke-width="1.3"`
          else if (l.kind === 'fold') attrs = `style="stroke:var(--gs-edge)" stroke-width="1.6" stroke-dasharray="8 5" opacity=".8"`
          else if (l.kind === 'chalk') attrs = `style="stroke:var(--gs-chalk)" stroke-width="${Math.max(2, s * 0.24).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity=".92"`
          else attrs = `stroke="#2E241B" stroke-width="1.5" stroke-linejoin="round"`
          return `<svg class="gs-ln" width="1" height="1" overflow="visible" style="transform:translateZ(${(l.z - p.z).toFixed(2)}px);opacity:${(l.op * this.faceOp(p, st)).toFixed(3)}"><polyline points="${pts}" fill="none" ${attrs}/></svg>`
        })
        .join('')
      if (html !== e.lcache) {
        e.lcache = html
        e.lns.innerHTML = html
      }
    }
  }

  /** A dressmaker's pin lying in the fabric: ball head, the shaft in and out of the weave */
  private pinSVG() {
    const s = this.s
    const L = 3.4 * s
    const r = Math.max(2.6, 0.32 * s)
    const w = Math.max(1, s * 0.085)
    const id = this.id
    return `<svg width="1" height="1" overflow="visible">
      <line x1="${-L / 2}" y1="0" x2="${-L / 2 + L * 0.36}" y2="0" stroke="url(#${id}-steel)" stroke-width="${w}" stroke-linecap="round"/>
      <line x1="${-L / 2 + L * 0.36}" y1="0" x2="${L / 2 - L * 0.26}" y2="0" stroke="#8F959C" stroke-width="${w * 0.8}" opacity=".22"/>
      <path d="M${L / 2 - L * 0.26},${-w / 2} L${L / 2},0 L${L / 2 - L * 0.26},${w / 2} Z" fill="url(#${id}-steel)"/>
      <circle cx="${-L / 2}" cy="0" r="${r}" fill="url(#${id}-ball)"/>
    </svg>`
  }

  private drawPins(st: SceneState) {
    for (const [key, e] of Object.entries(this.els)) {
      const p = st.p[key]
      const mine = st.pins.filter((q) => q.on === key && q.drop > 0 && q.out < 1)
      while (e.pins.length < mine.length) {
        const el = document.createElement('div')
        el.className = 'gs-pin'
        el.innerHTML = this.pinSVG()
        e.pc.appendChild(el)
        e.pins.push(el)
      }
      e.pins.forEach((el, i) => {
        const q = mine[i]
        if (!q) {
          el.style.display = 'none'
          return
        }
        el.style.display = ''
        const h = (1 - q.drop) * 70 + q.out * 50
        const [x, y, z] = this.local(p, q.x, q.y, q.z)
        el.style.transform = `translate3d(${x}px,${y}px,${z + 1.2 + h}px) rotate(${q.ang}rad)`
        el.style.opacity = String(clamp(q.drop * 3) * (1 - q.out) * this.faceOp(p, st))
        ;(el.firstChild as SVGElement).style.filter = `drop-shadow(${(1 + h * 0.2).toFixed(1)}px ${(1.5 + h * 0.45).toFixed(1)}px ${(1 + h * 0.15).toFixed(1)}px rgba(20,12,4,.3))`
      })
    }
  }

  /**
   * The tools. A sewing machine and a hand needle stand up, facing the viewer, with the needle
   * point on the seam; the rest lie on the fabric, pointing the way they travel. Sizes in cm.
   */
  private toolSVG(t: Tool) {
    const s = this.s
    const c = (v: number) => (v * s).toFixed(1)
    const id = this.id
    const steel = `url(#${id}-steel)`
    const f = t.phase % 1
    if (t.kind === 'machine') {
      // A sewing machine from the front: head over the needle, arm across, pillar down to the
      // bed on the right with the handwheel; needle down at each stitch, take-up lever the other way
      const down = (Math.cos(t.phase * Math.PI * 2) + 1) / 2
      const up = (1 - down) * 0.8
      const lever = -13 + 2.4 * down
      const body = `url(#${id}-body)`
      return `<svg width="1" height="1" overflow="visible"><g transform="scale(1.15)">
        <ellipse cx="0" cy="${c(-0.15)}" rx="${c(2.6)}" ry="${c(0.7)}" fill="#FFF6DA" opacity=".35"/>
        <path d="M${c(12.6)},0 L${c(12.6)},${c(-11)} L${c(16.8)},${c(-11)} L${c(16.8)},${c(-0.6)} Q${c(16.8)},0 ${c(16.2)},0 Z" fill="${body}" stroke="#A89E90" stroke-width=".9"/>
        <rect x="${c(1.5)}" y="${c(-14.2)}" width="${c(15.3)}" height="${c(4.1)}" rx="${c(1.6)}" fill="${body}" stroke="#A89E90" stroke-width=".9"/>
        <ellipse cx="${c(17.2)}" cy="${c(-11)}" rx="${c(0.7)}" ry="${c(2.4)}" fill="#B9AF9F" stroke="#8F877B" stroke-width=".8"/>
        <rect x="${c(4.5)}" y="${c(-12.6)}" width="${c(7)}" height="${c(0.35)}" rx="${c(0.17)}" fill="#7B4B2A" opacity=".7"/>
        <line x1="${c(10)}" y1="${c(-14.2)}" x2="${c(10)}" y2="${c(-16.8)}" stroke="#8F959C" stroke-width="${c(0.14)}"/>
        <rect x="${c(9.1)}" y="${c(-16.5)}" width="${c(1.8)}" height="${c(2.1)}" rx="${c(0.2)}" style="fill:var(--gs-thread)"/>
        <rect x="${c(8.9)}" y="${c(-16.7)}" width="${c(2.2)}" height="${c(0.35)}" rx="${c(0.1)}" fill="#C9B79C"/>
        <rect x="${c(8.9)}" y="${c(-14.6)}" width="${c(2.2)}" height="${c(0.35)}" rx="${c(0.1)}" fill="#C9B79C"/>
        <path d="M${c(10)},${c(-15.4)} L${c(2.4)},${c(-14.5)} L${c(-2)},${c(lever)} L${c(-0.5)},${c(-6.3)} L0,${c(-0.7 - up)}" fill="none" style="stroke:var(--gs-thread)" stroke-width="${Math.max(0.6, s * 0.05).toFixed(2)}" opacity=".85"/>
        <rect x="${c(-2.8)}" y="${c(-14.8)}" width="${c(5.6)}" height="${c(9)}" rx="${c(1.4)}" fill="${body}" stroke="#A89E90" stroke-width=".9"/>
        <rect x="${c(-2.35)}" y="${c(-13.7)}" width="${c(0.7)}" height="${c(3.6)}" rx="${c(0.35)}" fill="#3A342D" opacity=".75"/>
        <circle cx="${c(-2)}" cy="${c(lever)}" r="${c(0.36)}" fill="${steel}" stroke="#6F757C" stroke-width=".6"/>
        <circle cx="${c(1.2)}" cy="${c(-12.1)}" r="${c(0.85)}" fill="${steel}" stroke="#7D838A" stroke-width=".7"/>
        <line x1="${c(1.2)}" y1="${c(-12.8)}" x2="${c(1.2)}" y2="${c(-12.35)}" stroke="#3A342D" stroke-width="${c(0.1)}"/>
        <rect x="${c(-2.3)}" y="${c(-6.5)}" width="${c(4.6)}" height="${c(0.55)}" rx="${c(0.2)}" fill="#E4DDD1"/>
        <rect x="${c(0.5)}" y="${c(-5.9)}" width="${c(0.34)}" height="${c(5.2)}" fill="${steel}"/>
        <rect x="${c(-0.16)}" y="${c(-5.9)}" width="${c(0.32)}" height="${c(2.7 - up)}" fill="${steel}" stroke="#7D838A" stroke-width=".4"/>
        <rect x="${c(-0.42)}" y="${c(-3.35 - up)}" width="${c(0.84)}" height="${c(0.5)}" rx="${c(0.1)}" fill="#7D838A"/>
        <line x1="0" y1="${c(-2.85 - up)}" x2="0" y2="${c(-up)}" stroke="#D9DDE1" stroke-width="${Math.max(1, s * 0.11).toFixed(2)}" stroke-linecap="round"/>
        <rect x="${c(0.42)}" y="${c(-0.95)}" width="${c(0.5)}" height="${c(0.55)}" fill="#7D838A"/>
        <path d="M${c(-1)},${c(-0.42)} L${c(2.1)},${c(-0.42)} Q${c(2.5)},${c(-0.42)} ${c(2.5)},${c(-0.12)} L${c(2.5)},0 L${c(-1.25)},0 Q${c(-1.25)},${c(-0.32)} ${c(-1)},${c(-0.42)} Z" fill="${steel}" stroke="#6F757C" stroke-width=".6"/>
      </g></svg>`
    }
    if (t.kind === 'hand') {
      // the needle goes in and out of the fabric, the thread pulled along behind it
      const down = (Math.cos(t.phase * Math.PI * 2) + 1) / 2
      const lift = (1 - down) * 1.6
      return `<svg width="1" height="1" overflow="visible"><g transform="translate(0,${c(-lift)}) rotate(28)">
        <path d="M0,${c(-4.6)} C${c(-2.6)},${c(-6.4)} ${c(-5)},${c(-3.2)} ${c(-4.2)},${c(0.6 + lift)}" fill="none" style="stroke:var(--gs-thread)" stroke-width="${Math.max(0.8, s * 0.06).toFixed(2)}"/>
        <path d="M${c(-0.09)},${c(-4.9)} Q0,${c(-5.15)} ${c(0.09)},${c(-4.9)} L${c(0.06)},${c(-0.6)} L0,0 L${c(-0.06)},${c(-0.6)} Z" fill="${steel}" stroke="#7D838A" stroke-width=".5"/>
        <ellipse cx="0" cy="${c(-4.55)}" rx="${c(0.03)}" ry="${c(0.22)}" fill="#3A342D"/></g></svg>`
    }
    if (t.kind === 'scissors') {
      // a calm snip: opens and closes smoothly as it moves along
      const open = ((1 - Math.cos(f * Math.PI * 2)) / 2) * 0.2 + 0.03
      const half = (sign: number) => `<g transform="translate(${c(-6)},0) rotate(${((-sign * open * 180) / Math.PI).toFixed(2)})">
          <path d="M0,${c(-0.5 * sign)} L${c(5.7)},${c(-0.08 * sign)} Q${c(6.1)},0 ${c(5.7)},${c(0.05 * sign)} L0,${c(0.3 * sign)} Z" fill="${steel}" stroke="#6F757C" stroke-width=".7"/>
          <path d="M${c(0.4)},${c(-0.18 * sign)} L${c(5.4)},${c(-0.06 * sign)}" stroke="#fff" stroke-width=".8" opacity=".6"/>
          <path d="M0,0 L${c(-1.8)},${c(0.7 * sign)}" stroke="#25211D" stroke-width="${c(0.55)}" stroke-linecap="round"/>
          <ellipse cx="${c(sign > 0 ? -3.4 : -3.9)}" cy="${c(1.25 * sign)}" rx="${c(sign > 0 ? 1.35 : 1.9)}" ry="${c(sign > 0 ? 0.85 : 1.05)}" fill="none" stroke="#25211D" stroke-width="${c(0.45)}"/>
          <ellipse cx="${c(sign > 0 ? -3.4 : -3.9)}" cy="${c(1.1 * sign)}" rx="${c(sign > 0 ? 1.1 : 1.6)}" ry="${c(sign > 0 ? 0.6 : 0.8)}" fill="none" stroke="#fff" stroke-width=".7" opacity=".18"/>
        </g>`
      // a touch larger than life, so they read on a whole piece of fabric
      return `<svg width="1" height="1" overflow="visible"><g transform="scale(1.3)">${half(1)}${half(-1)}
        <circle cx="${c(-6)}" cy="0" r="${c(0.32)}" fill="${steel}" stroke="#5C6168" stroke-width=".6"/>
        <line x1="${c(-6.2)}" y1="${c(-0.12)}" x2="${c(-5.8)}" y2="${c(0.12)}" stroke="#4A4F55" stroke-width=".8"/></g></svg>`
    }
    if (t.kind === 'chalk') {
      const dust = [0.4, 0.9, 1.5].map((d, i) => `<circle cx="${c(-d)}" cy="${c((i - 1) * 0.35)}" r="${c(0.08 + i * 0.03)}" fill="#fff" opacity="${(0.7 - i * 0.18).toFixed(2)}"/>`).join('')
      return `<svg width="1" height="1" overflow="visible">${dust}
        <path d="M${c(0.1)},0 Q${c(-0.2)},${c(-0.35)} ${c(-0.6)},${c(-0.55)} L${c(-3.2)},${c(-1.85)} Q${c(-3.6)},${c(-2)} ${c(-3.6)},${c(-1.6)} L${c(-3.6)},${c(1.6)} Q${c(-3.6)},${c(2)} ${c(-3.2)},${c(1.85)} L${c(-0.6)},${c(0.55)} Q${c(-0.2)},${c(0.35)} ${c(0.1)},0 Z" fill="url(#${id}-chalk)" stroke="rgba(0,0,0,.16)" stroke-width=".8"/>
        <path d="M${c(-1)},${c(-0.6)} L${c(-3.2)},${c(-1.6)}" stroke="#fff" stroke-width="${c(0.12)}" opacity=".7"/></svg>`
    }
    // The iron: soleplate, body, the handle loop, a dial and the cord; steam from the tip
    const k = Math.min(0.7, (this.scene.frame[2] - this.scene.frame[0]) / 70)
    const puff = (i: number) => {
      const ph = (t.phase + i * 0.33) % 1
      return `<circle cx="${c(7.4 + ph * 3)}" cy="${c((i - 1) * 1.4)}" r="${c(0.35 + ph * 0.9)}" fill="#fff" opacity="${(0.42 * (1 - ph)).toFixed(2)}"/>`
    }
    return `<svg width="1" height="1" overflow="visible"><g transform="scale(${k.toFixed(2)})">
      <path d="M${c(-9)},${c(0.4)} C${c(-12)},${c(1)} ${c(-13)},${c(3.5)} ${c(-16)},${c(3.8)}" fill="none" stroke="#2A2622" stroke-width="${c(0.4)}" stroke-linecap="round"/>
      ${[0, 1, 2].map(puff).join('')}
      <path d="M${c(7)},0 C${c(5)},${c(-4.6)} ${c(-2)},${c(-5.4)} ${c(-7.5)},${c(-5)} Q${c(-9)},${c(-4.9)} ${c(-9)},${c(-3.4)} L${c(-9)},${c(3.4)} Q${c(-9)},${c(4.9)} ${c(-7.5)},${c(5)} C${c(-2)},${c(5.4)} ${c(5)},${c(4.6)} ${c(7)},0 Z" fill="${steel}" stroke="#7D838A" stroke-width="1"/>
      <path d="M${c(6)},0 C${c(4.2)},${c(-4)} ${c(-2)},${c(-4.6)} ${c(-7)},${c(-4.3)} Q${c(-8.3)},${c(-4.2)} ${c(-8.3)},${c(-2.9)} L${c(-8.3)},${c(2.9)} Q${c(-8.3)},${c(4.2)} ${c(-7)},${c(4.3)} C${c(-2)},${c(4.6)} ${c(4.2)},${c(4)} ${c(6)},0 Z" fill="url(#${id}-ironbody)"/>
      <rect x="${c(-6.6)}" y="${c(-1.25)}" width="${c(9.8)}" height="${c(2.5)}" rx="${c(1.25)}" fill="#4A453F"/>
      <rect x="${c(-5.2)}" y="${c(-0.5)}" width="${c(6.6)}" height="${c(1)}" rx="${c(0.5)}" fill="#1B1815"/>
      <path d="M${c(-6.2)},${c(-1)} L${c(2.8)},${c(-1)}" stroke="#fff" stroke-width="${c(0.14)}" opacity=".22" stroke-linecap="round"/>
      <circle cx="${c(-7.3)}" cy="0" r="${c(0.85)}" fill="#E9E4DA" stroke="#8F877B" stroke-width=".7"/>
      <line x1="${c(-7.3)}" y1="0" x2="${c(-6.75)}" y2="${c(-0.45)}" stroke="#3A342D" stroke-width="${c(0.12)}"/>
      <ellipse cx="${c(4)}" cy="0" rx="${c(1)}" ry="${c(0.6)}" fill="#BFD3D8" opacity=".55"/></g></svg>`
  }

  private drawTool(st: SceneState) {
    const t = st.tool
    if (!t || !this.els[t.on]) {
      this.toolEl.style.display = this.toolSh.style.display = 'none'
      return
    }
    const e = this.els[t.on]
    const p = st.p[t.on]
    if (this.toolEl.parentNode !== e.pc) e.pc.append(this.toolSh, this.toolEl)
    this.toolEl.style.display = this.toolSh.style.display = ''
    const s = this.s
    const [x, y, z0] = this.local(p, t.x, t.y, t.z)
    this.toolEl.innerHTML = this.toolSVG(t)
    if (t.kind === 'machine' || t.kind === 'hand') {
      // Standing up, facing the viewer, the needle point on the seam; a soft shadow beneath
      this.toolEl.style.transform = `translate3d(${x}px,${y}px,${z0 + 0.4}px) rotateX(${-RULES.tilt}deg)`
      const rx = (t.kind === 'machine' ? 10 : 1.4) * s
      this.toolSh.innerHTML = `<svg width="1" height="1" overflow="visible"><ellipse cx="${(t.kind === 'machine' ? 8 : -0.6) * s}" cy="${-0.8 * s}" rx="${rx}" ry="${rx * 0.22}" fill="#1a120a"/></svg>`
      this.toolSh.style.transform = `translate3d(${x}px,${y}px,${z0 - 0.2}px)`
      this.toolSh.style.filter = `blur(${Math.max(2, s * 0.5).toFixed(1)}px)`
      this.toolSh.style.opacity = '0.2'
      return
    }
    const z = z0 + 6
    this.toolSh.innerHTML = this.toolEl.innerHTML
    this.toolEl.style.transform = `translate3d(${x}px,${y}px,${z}px) rotate(${t.ang}rad)`
    this.toolSh.style.transform = `translate3d(${x + z * 0.25}px,${y + z * 0.55}px,${z0 - 0.4}px) rotate(${t.ang}rad)`
    this.toolSh.style.filter = `brightness(0) blur(${(1.5 + z * 0.12).toFixed(1)}px)`
    this.toolSh.style.opacity = '0.22'
  }

  private drawCamera(st: SceneState) {
    const fx = this.ox + st.cam.fx * this.s
    const fyT = this.oy + st.cam.fy * this.s
    const fy = this.H / 2 + (fyT - this.H / 2) * Math.cos((RULES.tilt * Math.PI) / 180)
    const a = clamp((st.cam.z - 1) / 0.25)
    this.cam.style.transformOrigin = `${fx}px ${fy}px`
    this.cam.style.transform = `translate(${(this.W / 2 - fx) * a}px,${(this.H / 2 - fy) * a}px) scale(${st.cam.z})`
  }

  render(time: number) {
    if (!this.W || !this.cam) return
    this.time = time
    const st = stateAt(this.scene, time)
    this.drawCamera(st)
    for (const p of Object.values(st.p)) this.drawPiece(p, st)
    this.drawLines(st)
    this.drawPins(st)
    this.drawTool(st)
  }
}

