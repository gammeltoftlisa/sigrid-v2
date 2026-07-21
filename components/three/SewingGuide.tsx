'use client'

import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
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
    containerRef.current.appendChild(renderer.domElement)

    // Lighting
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.9))
    const key = new THREE.DirectionalLight(0xfff8f0, 1.6)
    key.position.set(2.5, 6, 5); key.castShadow = true
    scene.add(key)
    const fill1 = new THREE.DirectionalLight(0xddeeff, 0.45)
    fill1.position.set(-4, 2, -3); scene.add(fill1)
    const fill2 = new THREE.DirectionalLight(0xfff0e0, 0.25)
    fill2.position.set(0, -3, 2); scene.add(fill2)
    const rim = new THREE.DirectionalLight(0xffffff, 0.30)
    rim.position.set(0, 1, -5); scene.add(rim)

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({ color: 0xEAE5DE, roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = GROUND_Y
    ground.receiveShadow = true
    scene.add(ground)

    // Stand
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xADA095, roughness: 0.45, metalness: 0.35 })
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.0, 10), stickMat)
    pole.position.y = GROUND_Y + 0.50
    scene.add(pole)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.38, 0.055, 30), stickMat)
    base.position.y = GROUND_Y + 0.028
    scene.add(base)

    // ── Load female mannequin GLB ────────────────────────────────────
    const manMat = new THREE.MeshStandardMaterial({
      color: 0xC9BBAA, roughness: 0.65, metalness: 0.02,
    })
    let cancelled = false
    const loader = new GLTFLoader()
    loader.load('/models/mannequin.glb', (gltf) => {
      if (cancelled) return
      const model = gltf.scene

      // Scale so height fits MANNEQUIN_HEIGHT, center and place at ground
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const scale = MANNEQUIN_HEIGHT / size.y
      model.scale.setScalar(scale)
      model.position.set(
        -center.x * scale,
        GROUND_Y - box.min.y * scale,
        -center.z * scale,
      )
      // Neutral matte mannequin material on the single body mesh
      model.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) {
          mesh.material = manMat
          mesh.castShadow = true
        }
      })

      scene.add(model)
    })

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
      cancelled = true
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
