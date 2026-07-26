'use client'

import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import type { SewingStep } from '@/lib/types'

interface Props {
  steps: SewingStep[]
  currentStep: number
  isCompleted: boolean
}

type MeshKey = 'body' | 'leftSleeve' | 'rightSleeve' | 'collar' | 'hem' | 'yoke'

// ── Sleeve angle — matches Michelle's T-pose (arms nearly horizontal) ──
const AP    = Math.PI * 0.46   // ≈83°
const sinAP = Math.sin(AP)
const cosAP = Math.cos(AP)

// ── T-shirt profile draped over the loaded body ───────────────────
// Tuned for model scaled so crown≈0.92, crotch≈-0.52, floor≈-1.72
const SHIRT_PROFILE: [number, number][] = [
  [0.178, 0.460],
  [0.206, 0.442],
  [0.262, 0.406],
  [0.245, 0.296],
  [0.232, 0.160],
  [0.222, 0.040],
  [0.212, -0.100],
  [0.230, -0.210],
  [0.260, -0.375],
  [0.252, -0.466],
  [0.244, -0.532],
]

const SHIRT_SH_R = 0.262
const SHIRT_SH_Y = 0.406
const SLEEVE_H   = 0.24
const SLEEVE_R   = 0.096

const GARMENT_COL   = 0xDAD4CA
const HIGHLIGHT_COL = 0xBF8B5E
const DIM_COL       = 0xC2BDB3
const SUCCESS_COL   = 0x4E7D4F
const SEAM_COL      = 0xBF8B5E

// Target height for the loaded mannequin in scene units (crown to floor)
const MANNEQUIN_HEIGHT = 2.64
const GROUND_Y         = -1.72

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function lerpV(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, t: number) {
  out.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t))
}
function stdMat(color: number, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.72, metalness: 0,
    side: THREE.DoubleSide, transparent: opacity < 1, opacity,
  })
}
function dashedLine(pts: THREE.Vector3[], color = SEAM_COL, dash = 0.032, gap = 0.018): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap, linewidth: 2 })
  const line = new THREE.Line(geo, mat)
  line.computeLineDistances(); line.visible = false
  return line
}
function ring(r: number, y: number, n = 48) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
  })
}
function oval(rx: number, rz: number, y: number, n = 48) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return new THREE.Vector3(Math.cos(a) * rx, y, Math.sin(a) * rz)
  })
}
function vline(x: number, z: number, y0: number, y1: number, n = 22) {
  return Array.from({ length: n }, (_, i) => new THREE.Vector3(x, lerp(y0, y1, i / (n - 1)), z))
}

function getHighlightKeys(step: SewingStep): MeshKey[] {
  switch (step.highlight) {
    case 'front':
    case 'back':
    case 'side':     return ['body']
    case 'shoulder': return ['body', 'yoke']
    case 'sleeve':   return ['leftSleeve', 'rightSleeve', 'yoke']
    case 'collar':   return ['collar']
    case 'hem':      return ['hem']
    case 'all':      return ['body', 'leftSleeve', 'rightSleeve', 'collar', 'hem', 'yoke']
    default:         return ['body']
  }
}

export default function SewingGuide({ steps, currentStep, isCompleted }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const meshMapRef   = useRef<Record<MeshKey, THREE.Mesh> | null>(null)
  const garmentRef   = useRef<THREE.Group | null>(null)
  const allSeams     = useRef<THREE.Line[]>([])
  const seamMap      = useRef<Record<string, THREE.Line[]>>({})
  const seamPathMap  = useRef<Record<string, THREE.Vector3[]>>({})
  const needleMesh   = useRef<THREE.Mesh | null>(null)
  const needlePath   = useRef<THREE.Vector3[]>([])
  const needleT      = useRef(0)
  const rafRef       = useRef(0)
  const tPos  = useRef(new THREE.Vector3(0, 0.15, 3.8))
  const tLook = useRef(new THREE.Vector3(0, -0.05, 0))
  const cPos  = useRef(new THREE.Vector3(0, 0.15, 3.8))
  const cLook = useRef(new THREE.Vector3(0, -0.05, 0))
  const celebRef = useRef(false)

  const applyStep = useCallback((step: SewingStep, completed: boolean) => {
    const mm = meshMapRef.current
    if (!mm) return
    const all: MeshKey[] = ['body', 'leftSleeve', 'rightSleeve', 'collar', 'hem', 'yoke']
    const hl = getHighlightKeys(step)
    const isAll = step.highlight === 'all'

    all.forEach(k => {
      const mat = mm[k].material as THREE.MeshStandardMaterial
      const on = isAll || hl.includes(k)
      if (on) {
        mat.color.setHex(isAll && completed ? SUCCESS_COL : HIGHLIGHT_COL)
        mat.emissive.setHex(HIGHLIGHT_COL)
        mat.emissiveIntensity = completed ? 0.10 : 0.26
        mat.opacity = 1; mat.transparent = false
      } else {
        mat.color.setHex(DIM_COL)
        mat.emissive.setHex(0x000000)
        mat.emissiveIntensity = 0
        mat.opacity = 0.26; mat.transparent = true
      }
      mat.needsUpdate = true
    })

    allSeams.current.forEach(l => { l.visible = false })
    const lines = isAll ? allSeams.current : (seamMap.current[step.highlight] ?? [])
    lines.forEach(l => { l.visible = true })

    if (!isAll) {
      const pts = seamPathMap.current[step.highlight] ?? []
      needlePath.current = pts; needleT.current = 0
      if (needleMesh.current) needleMesh.current.visible = pts.length > 0
    } else {
      if (needleMesh.current) needleMesh.current.visible = false
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const W = containerRef.current.clientWidth
    const H = containerRef.current.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xF9F7F4)
    scene.fog = new THREE.Fog(0xF9F7F4, 14, 24)

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 50)
    camera.position.copy(cPos.current)
    camera.lookAt(cLook.current)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.outputColorSpace = THREE.SRGBColorSpace
    containerRef.current.appendChild(renderer.domElement)

    // Lighting — studio setup matching reference
    const hemi = new THREE.HemisphereLight(0xffffff, 0xD6D0C8, 0.70)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(2.0, 9, 5); key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 20
    key.shadow.radius = 4
    scene.add(key)
    const fill1 = new THREE.DirectionalLight(0xddeeff, 0.55)
    fill1.position.set(-4, 3, 2); scene.add(fill1)
    const fill2 = new THREE.DirectionalLight(0xfff8f2, 0.20)
    fill2.position.set(0, -2, 3); scene.add(fill2)
    const rim = new THREE.DirectionalLight(0xffffff, 0.45)
    rim.position.set(0, 3, -5); scene.add(rim)

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({ color: 0xEAE5DE, roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = GROUND_Y
    ground.receiveShadow = true
    scene.add(ground)

    // ── Parametric female mannequin ──────────────────────────────────
    // Body built from continuous elliptical cross-section meshes —
    // single smooth surface per body part, no visible seams.
    const manMat = new THREE.MeshStandardMaterial({
      color: 0xE8E5E0, roughness: 0.40, metalness: 0.0, envMapIntensity: 0.5,
    })

    // Build a smooth mesh by stacking elliptical rings and connecting them.
    // cz > 0 = shift oval forward (+z toward camera) — used for bust.
    // cz < 0 = shift oval backward — used for buttocks.
    type Sec = { y: number; rx: number; rz: number; cz?: number }
    function buildSec(secs: Sec[], n: number, capBot: boolean, capTop: boolean): THREE.Mesh {
      const v: number[] = [], ix: number[] = [], ri: number[] = []
      for (const { y, rx, rz, cz = 0 } of secs) {
        ri.push(v.length / 3)
        for (let j = 0; j < n; j++) {
          const a = (j / n) * Math.PI * 2
          v.push(Math.cos(a) * rx, y, cz + Math.sin(a) * rz)
        }
      }
      for (let i = 0; i < secs.length - 1; i++) {
        const r0 = ri[i], r1 = ri[i + 1]
        for (let j = 0; j < n; j++) {
          const j1 = (j + 1) % n
          ix.push(r0+j, r1+j, r0+j1,  r0+j1, r1+j, r1+j1)
        }
      }
      if (capBot) {
        const ci = v.length / 3; const s = secs[0]
        v.push(0, s.y, s.cz ?? 0)
        for (let j = 0; j < n; j++) ix.push(ci, ri[0]+(j+1)%n, ri[0]+j)
      }
      if (capTop) {
        const ci = v.length / 3; const s = secs[secs.length-1]
        v.push(0, s.y, s.cz ?? 0)
        const r = ri[secs.length-1]
        for (let j = 0; j < n; j++) ix.push(ci, r+j, r+(j+1)%n)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
      geo.setIndex(ix); geo.computeVertexNormals()
      const m = new THREE.Mesh(geo, manMat); m.castShadow = true; return m
    }

    // Build a tube mesh along an arbitrary 3D direction with varying radius.
    // Used for arms so they sit naturally perpendicular to the arm axis.
    function buildTube(
      start: THREE.Vector3, dir: THREE.Vector3,
      lengths: number[], radii: number[], n: number,
    ): THREE.Mesh {
      const up = new THREE.Vector3(0, 1, 0)
      const p1 = new THREE.Vector3().crossVectors(dir, up).normalize()
      const p2 = new THREE.Vector3().crossVectors(dir, p1).normalize()
      const v: number[] = [], ix: number[] = [], ri: number[] = []
      for (let i = 0; i < lengths.length; i++) {
        ri.push(v.length / 3)
        const c = start.clone().addScaledVector(dir, lengths[i])
        for (let j = 0; j < n; j++) {
          const a = (j / n) * Math.PI * 2
          const p = c.clone().addScaledVector(p1, Math.cos(a) * radii[i])
                              .addScaledVector(p2, Math.sin(a) * radii[i])
          v.push(p.x, p.y, p.z)
        }
      }
      for (let i = 0; i < lengths.length - 1; i++) {
        const r0 = ri[i], r1 = ri[i+1]
        for (let j = 0; j < n; j++) {
          const j1 = (j+1)%n
          ix.push(r0+j, r1+j, r0+j1,  r0+j1, r1+j, r1+j1)
        }
      }
      // End cap at wrist
      const ci = v.length/3; const last = ri[ri.length-1]
      const ctr = start.clone().addScaledVector(dir, lengths[lengths.length-1])
      v.push(ctr.x, ctr.y, ctr.z)
      for (let j = 0; j < n; j++) ix.push(ci, last+j, last+(j+1)%n)
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
      geo.setIndex(ix); geo.computeVertexNormals()
      const m = new THREE.Mesh(geo, manMat); m.castShadow = true; return m
    }

    const body = new THREE.Group()

    // ── TRUNK: crotch (−0.514) → crown (0.918), one continuous mesh ──
    // The cz offset is the secret: +cz tilts the oval forward (bust),
    // −cz tilts it backward (buttocks), giving proper 3D body contour.
    const trunkSecs: Sec[] = [
      { y: -0.514, rx: 0.092, rz: 0.078, cz:  0.000 }, // crotch
      { y: -0.442, rx: 0.152, rz: 0.118, cz: -0.008 }, // lower pelvis
      { y: -0.348, rx: 0.188, rz: 0.155, cz: -0.022 }, // full hip
      { y: -0.272, rx: 0.194, rz: 0.162, cz: -0.030 }, // buttocks peak (shifted back)
      { y: -0.195, rx: 0.180, rz: 0.144, cz: -0.020 }, // lower waist back
      { y: -0.100, rx: 0.144, rz: 0.118, cz: -0.005 }, // high waist
      { y:  0.000, rx: 0.118, rz: 0.096, cz:  0.010 }, // waist (narrowest)
      { y:  0.104, rx: 0.150, rz: 0.120, cz:  0.022 }, // under-bust
      { y:  0.186, rx: 0.170, rz: 0.152, cz:  0.045 }, // bust peak (shifted forward)
      { y:  0.244, rx: 0.168, rz: 0.138, cz:  0.028 }, // upper bust
      { y:  0.318, rx: 0.196, rz: 0.130, cz:  0.010 }, // chest / pectorals
      { y:  0.382, rx: 0.208, rz: 0.128, cz: -0.004 }, // upper chest
      { y:  0.426, rx: 0.212, rz: 0.130, cz: -0.010 }, // shoulder / deltoid peak
      { y:  0.464, rx: 0.195, rz: 0.120, cz: -0.006 }, // shoulder top
      { y:  0.502, rx: 0.162, rz: 0.108, cz:  0.000 }, // trapezius / neck base
      { y:  0.530, rx: 0.125, rz: 0.090, cz:  0.000 }, // lower neck
      { y:  0.550, rx: 0.090, rz: 0.076, cz:  0.000 }, // mid neck
      { y:  0.568, rx: 0.074, rz: 0.065, cz:  0.000 }, // upper neck
      { y:  0.582, rx: 0.068, rz: 0.060, cz:  0.002 }, // neck top
      { y:  0.600, rx: 0.074, rz: 0.084, cz:  0.014 }, // chin / jaw base
      { y:  0.626, rx: 0.110, rz: 0.114, cz:  0.012 }, // jaw / lower cheek
      { y:  0.656, rx: 0.136, rz: 0.132, cz:  0.014 }, // cheekbones
      { y:  0.692, rx: 0.150, rz: 0.142, cz:  0.008 }, // mid-face
      { y:  0.724, rx: 0.152, rz: 0.138, cz:  0.004 }, // eye level
      { y:  0.754, rx: 0.150, rz: 0.132, cz:  0.000 }, // brow ridge
      { y:  0.780, rx: 0.142, rz: 0.124, cz:  0.000 }, // forehead
      { y:  0.804, rx: 0.130, rz: 0.114, cz:  0.000 }, // upper forehead
      { y:  0.826, rx: 0.112, rz: 0.098, cz:  0.000 }, // crown base
      { y:  0.848, rx: 0.088, rz: 0.078, cz:  0.000 },
      { y:  0.868, rx: 0.062, rz: 0.055, cz:  0.000 },
      { y:  0.886, rx: 0.042, rz: 0.038, cz:  0.000 },
      { y:  0.902, rx: 0.026, rz: 0.022, cz:  0.000 },
      { y:  0.918, rx: 0.008, rz: 0.007, cz:  0.000 }, // crown tip
    ]
    body.add(buildSec(trunkSecs, 36, false, true))

    // ── LEGS: floor (−1.72) → crotch (−0.514), one mesh per leg ─────
    // Placed at x = ±legX after building. Foot shape captured via cz offsets.
    const legSecs: Sec[] = [
      { y: -1.720, rx: 0.036, rz: 0.072, cz:  0.040 }, // toe tips (floor)
      { y: -1.710, rx: 0.038, rz: 0.076, cz:  0.036 }, // ball of foot
      { y: -1.700, rx: 0.040, rz: 0.070, cz:  0.028 }, // mid foot
      { y: -1.685, rx: 0.040, rz: 0.058, cz:  0.015 }, // arch
      { y: -1.668, rx: 0.042, rz: 0.048, cz:  0.000 }, // ankle
      { y: -1.648, rx: 0.046, rz: 0.044, cz:  0.000 }, // lower ankle
      { y: -1.610, rx: 0.052, rz: 0.048, cz:  0.000 }, // ankle-calf join
      { y: -1.520, rx: 0.058, rz: 0.052, cz:  0.000 }, // lower calf
      { y: -1.420, rx: 0.064, rz: 0.058, cz:  0.000 }, // calf peak
      { y: -1.320, rx: 0.062, rz: 0.056, cz:  0.000 }, // upper calf
      { y: -1.210, rx: 0.058, rz: 0.052, cz:  0.000 }, // below knee
      { y: -1.095, rx: 0.064, rz: 0.060, cz:  0.010 }, // kneecap (slight front bump)
      { y: -1.000, rx: 0.062, rz: 0.055, cz:  0.000 }, // above knee
      { y: -0.900, rx: 0.074, rz: 0.065, cz: -0.005 }, // lower thigh
      { y: -0.800, rx: 0.082, rz: 0.072, cz: -0.010 }, // mid thigh
      { y: -0.700, rx: 0.084, rz: 0.074, cz: -0.012 }, // upper thigh
      { y: -0.610, rx: 0.078, rz: 0.068, cz: -0.006 }, // thigh tapering
      { y: -0.540, rx: 0.060, rz: 0.052, cz:  0.000 }, // thigh top
      { y: -0.514, rx: 0.044, rz: 0.038, cz:  0.000 }, // crotch join (open top)
    ]
    for (const side of [-1, 1] as const) {
      const leg = buildSec(legSecs, 22, true, false)
      leg.position.x = side * 0.090
      body.add(leg)
    }

    // ── ARMS: shoulder → hand, tube built along arm direction ────────
    const SH_X = 0.212
    const SH_Y = 0.428
    const armDir = (side: 1 | -1) =>
      new THREE.Vector3(side * sinAP, -cosAP, 0).normalize()

    const armLengths = [0, 0.05, 0.12, 0.22, 0.30, 0.36, 0.42, 0.48, 0.54, 0.58, 0.62, 0.65, 0.68]
    const armRadii  = [0.068, 0.064, 0.060, 0.057, 0.055, 0.058, 0.053, 0.046, 0.038, 0.034, 0.041, 0.037, 0.019]
    //                 shldr → deltoid → upper arm → elbow bump → forearm → wrist → palm → tips

    for (const side of [-1, 1] as const) {
      const start = new THREE.Vector3(side * SH_X, SH_Y, 0)
      body.add(buildTube(start, armDir(side), armLengths, armRadii, 18))
    }

    scene.add(body)

    // ── T-SHIRT GARMENT ──────────────────────────────────────────────
    const garment = new THREE.Group()
    garmentRef.current = garment
    scene.add(garment)

    const shirtPts = SHIRT_PROFILE.map(([r, y]) => new THREE.Vector2(r, y))
    const bodyMesh = new THREE.Mesh(new THREE.LatheGeometry(shirtPts, 56), stdMat(GARMENT_COL))
    bodyMesh.castShadow = true

    const yokeMesh = new THREE.Mesh(
      new THREE.TorusGeometry(SHIRT_SH_R - 0.012, 0.036, 10, 36),
      stdMat(GARMENT_COL),
    )
    yokeMesh.position.y = SHIRT_SH_Y; yokeMesh.rotation.x = 0.05

    function makeSleeve(side: 1 | -1): THREE.Mesh {
      const sx = side * SHIRT_SH_R
      const sy = SHIRT_SH_Y
      const hh = SLEEVE_H / 2
      const cx = sx + hh * side * sinAP
      const cy = sy - hh * cosAP
      const geo = new THREE.CylinderGeometry(SLEEVE_R - 0.004, SLEEVE_R, SLEEVE_H, 18, 1, true)
      const m = new THREE.Mesh(geo, stdMat(GARMENT_COL))
      m.position.set(cx, cy, 0); m.rotation.z = side * AP; m.castShadow = true
      return m
    }
    const lSleeve = makeSleeve(-1)
    const rSleeve = makeSleeve(1)

    const collarMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.178, 0.026, 12, 36),
      stdMat(GARMENT_COL),
    )
    collarMesh.position.y = 0.460; collarMesh.rotation.x = 0.08

    const hemMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.244, 0.020, 8, 36),
      stdMat(GARMENT_COL),
    )
    hemMesh.position.y = -0.532

    garment.add(bodyMesh, yokeMesh, lSleeve, rSleeve, collarMesh, hemMesh)
    meshMapRef.current = {
      body: bodyMesh, yoke: yokeMesh,
      leftSleeve: lSleeve, rightSleeve: rSleeve,
      collar: collarMesh, hem: hemMesh,
    }

    // ── SEAM LINES ───────────────────────────────────────────────────
    const seamGroup = new THREE.Group()
    scene.add(seamGroup)

    const frontCut = dashedLine([
      new THREE.Vector3(-0.252, 0.460, 0.252),
      new THREE.Vector3( 0.252, 0.460, 0.252),
      new THREE.Vector3( 0.252, -0.532, 0.252),
      new THREE.Vector3(-0.252, -0.532, 0.252),
      new THREE.Vector3(-0.252, 0.460, 0.252),
    ], SEAM_COL, 0.04, 0.025)

    const backCut = dashedLine([
      new THREE.Vector3(-0.252, 0.450, -0.252),
      new THREE.Vector3( 0.252, 0.450, -0.252),
      new THREE.Vector3( 0.252, -0.532, -0.252),
      new THREE.Vector3(-0.252, -0.532, -0.252),
      new THREE.Vector3(-0.252, 0.450, -0.252),
    ], SEAM_COL, 0.04, 0.025)

    const lShoulderSeam = dashedLine([
      new THREE.Vector3(-0.174, 0.460, 0),
      new THREE.Vector3(-0.218, 0.432, 0),
      new THREE.Vector3(-0.262, 0.406, 0),
    ])
    const rShoulderSeam = dashedLine([
      new THREE.Vector3( 0.174, 0.460, 0),
      new THREE.Vector3( 0.218, 0.432, 0),
      new THREE.Vector3( 0.262, 0.406, 0),
    ])

    const lSideSeam = dashedLine(vline(-0.252, 0, 0.40, -0.532, 28))
    const rSideSeam = dashedLine(vline( 0.252, 0, 0.40, -0.532, 28))

    function armholeOval(side: 1 | -1): THREE.Line {
      const cx = side * SHIRT_SH_R
      const cy = SHIRT_SH_Y
      const pts = Array.from({ length: 33 }, (_, i) => {
        const a = (i / 32) * Math.PI * 2
        return new THREE.Vector3(
          cx + Math.cos(a) * 0.095 * cosAP,
          cy + Math.cos(a) * 0.095 * side * sinAP,
          Math.sin(a) * 0.145,
        )
      })
      return dashedLine(pts)
    }
    const lArmhole = armholeOval(-1)
    const rArmhole = armholeOval(1)

    const neckSeam = dashedLine(oval(0.178, 0.154, 0.460))
    const hemSeam  = dashedLine(ring(0.244, -0.532))

    function sleeveEndCircle(side: 1 | -1): THREE.Line {
      const endX = side * SHIRT_SH_R + side * SLEEVE_H * sinAP
      const endY = SHIRT_SH_Y - SLEEVE_H * cosAP
      const pts = Array.from({ length: 33 }, (_, i) => {
        const a = (i / 32) * Math.PI * 2
        return new THREE.Vector3(
          endX + Math.cos(a) * SLEEVE_R * cosAP,
          endY + Math.cos(a) * SLEEVE_R * side * sinAP,
          Math.sin(a) * SLEEVE_R,
        )
      })
      return dashedLine(pts)
    }
    const lSleeveEnd = sleeveEndCircle(-1)
    const rSleeveEnd = sleeveEndCircle(1)

    const allSeamLines = [
      frontCut, backCut,
      lShoulderSeam, rShoulderSeam,
      lSideSeam, rSideSeam,
      lArmhole, rArmhole,
      neckSeam, hemSeam,
      lSleeveEnd, rSleeveEnd,
    ]
    allSeamLines.forEach(l => seamGroup.add(l))
    allSeams.current = allSeamLines

    function linePoints(line: THREE.Line): THREE.Vector3[] {
      const pos = (line.geometry as THREE.BufferGeometry).attributes.position
      return Array.from({ length: pos.count }, (_, i) =>
        new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)),
      )
    }
    seamMap.current = {
      front: [frontCut], back: [backCut],
      shoulder: [lShoulderSeam, rShoulderSeam],
      side: [lSideSeam, rSideSeam],
      sleeve: [lArmhole, rArmhole],
      collar: [neckSeam],
      hem: [hemSeam, lSleeveEnd, rSleeveEnd],
      all: allSeamLines,
    }
    seamPathMap.current = Object.fromEntries(
      Object.entries(seamMap.current).map(([k, lines]) => [k, lines.flatMap(linePoints)]),
    )

    // Animated needle
    const needle = new THREE.Mesh(
      new THREE.SphereGeometry(0.019, 10, 8),
      new THREE.MeshStandardMaterial({
        color: SEAM_COL, emissive: SEAM_COL, emissiveIntensity: 1.5,
        roughness: 0.2, metalness: 0.6,
      }),
    )
    needle.visible = false
    scene.add(needle)
    needleMesh.current = needle

    if (steps.length > 0) applyStep(steps[0], false)

    const onResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      renderer.setSize(w, h); camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      lerpV(cPos.current, cPos.current, tPos.current, 0.05)
      lerpV(cLook.current, cLook.current, tLook.current, 0.05)
      camera.position.copy(cPos.current)
      camera.lookAt(cLook.current)

      if (celebRef.current && garmentRef.current) garmentRef.current.rotation.y += 0.007

      const pts = needlePath.current
      if (needle.visible && pts.length > 1) {
        needleT.current = (needleT.current + 0.006) % 1
        const t = needleT.current * (pts.length - 1)
        const i = Math.floor(t)
        needle.position.lerpVectors(
          pts[Math.min(i, pts.length - 1)],
          pts[Math.min(i + 1, pts.length - 1)],
          t - i,
        )
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      try { renderer.domElement.parentNode?.removeChild(renderer.domElement) } catch {}
    }
  }, [applyStep, steps])

  useEffect(() => {
    if (!meshMapRef.current || steps.length === 0) return
    const step = steps[currentStep]
    if (!step) return
    applyStep(step, isCompleted)
    const [px, py, pz] = step.camera.position
    const [tx, ty, tz] = step.camera.target
    tPos.current.set(px, py, pz)
    tLook.current.set(tx, ty, tz)
    celebRef.current = isCompleted && currentStep === steps.length - 1
    if (!celebRef.current && garmentRef.current) garmentRef.current.rotation.y = 0
  }, [currentStep, steps, isCompleted, applyStep])

  return <div ref={containerRef} className="w-full h-full" />
}
