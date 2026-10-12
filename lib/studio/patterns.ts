import type { Difficulty, GarmentCategory, GarmentGuide, PieceDims, SewingStep2D, StandardSize } from '@/lib/types'
import type { Tool } from '@/components/sewing/tools'
import { standardSizes } from '@/lib/data'
import { allSizes } from '@/lib/sizes'
import type { DeepPartial } from 'ai'
import type { DraftPiece, DraftStep, GuideDraft, WriteRequest } from './schema'

/**
 * A pattern a maker is writing in the studio. It is kept in this browser
 * (localStorage) like the rest of the prototype's data.
 */

/** One number per size the pattern comes in; null while not filled in */
export type PerSize<T> = Partial<Record<StandardSize, T>>

export interface BodySize {
  bust: number | null
  waist: number | null
  hips: number | null
}

export interface PieceSize {
  width: number | null
  length: number | null
}

export interface StudioPiece {
  id: string
  label: string
  name: string
  shape: 'rectangle' | 'trapezoid'
  /** Width and length in cm, for every size */
  bySize: PerSize<PieceSize>
  /** The outline drawn in the guide: the base size, kept in step by withDerived() */
  dims: PieceDims
  quantity: number
  grainLine: 'vertical' | 'horizontal'
  seamAllowance: number
}

export interface StudioStep extends SewingStep2D {
  /** Set by the assistant when it had to guess; cleared when the maker presses "Looks right" */
  review?: string
}

export interface StudioMessage {
  role: 'maker' | 'assistant'
  text: string
}

export interface StudioFabric {
  /** e.g. "Linen or cotton poplin" */
  name: string
  /** Why it suits the garment, one sentence */
  why: string
  /** Metres of 140–150 cm wide fabric, for every size */
  metersBySize: PerSize<number | null>
}

export interface StudioPattern {
  id: string
  name: string
  category: GarmentCategory
  difficulty: Difficulty
  description: string
  /** e.g. "3–4 hours" */
  estimatedTime: string
  /** Price in euro */
  price: number | null
  sizes: StandardSize[]
  /** Body measurements in cm that each size is made for: the size chart sewers choose from */
  sizeChart: PerSize<BodySize>
  fabric: StudioFabric
  /** Everything else to buy, one item per line: "Zip, 20 cm" */
  notions: string[]
  tools: Tool[]
  /** Seam allowance for every piece, in cm */
  seamAllowance: number
  pieces: StudioPiece[]
  steps: StudioStep[]
  messages: StudioMessage[]
  status: 'draft' | 'ready'
  updatedAt: number
}

const KEY = 'sigrid_studio_patterns'

/** "1 step", "3 steps" */
export const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`

const defaults = (): Omit<StudioPattern, 'id' | 'updatedAt'> => ({
  name: 'Untitled pattern',
  category: 'Tops',
  difficulty: 'Beginner',
  description: '',
  estimatedTime: '',
  price: null,
  sizes: [],
  sizeChart: {},
  fabric: { name: '', why: '', metersBySize: {} },
  notions: [],
  tools: ['scissors', 'pins', 'needle', 'iron'],
  seamAllowance: 1.5,
  pieces: [],
  steps: [],
  messages: [],
  status: 'draft',
})

/** Fills in fields added after a pattern was first saved */
type Saved = Partial<StudioPattern> & { id: string; fabric?: Partial<StudioFabric> & { meters?: number | null } }

const normalize = (saved: Saved): StudioPattern => {
  const p = { ...defaults(), updatedAt: Date.now(), ...saved, fabric: { ...defaults().fabric, ...saved.fabric } } as StudioPattern
  const base = baseSize(p.sizes)
  // Patterns saved before sizes had their own numbers: the old single numbers become the base size
  const oldMeters = saved.fabric?.meters
  if (oldMeters && Object.keys(p.fabric.metersBySize ?? {}).length === 0) p.fabric.metersBySize = { [base]: oldMeters }
  p.pieces = p.pieces.map((piece) =>
    piece.bySize ? piece : { ...piece, bySize: piece.dims?.height ? { [base]: { width: piece.dims.topWidth, length: piece.dims.height } } : {} },
  )
  return withDerived(p)
}

export function loadPatterns(): StudioPattern[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StudioPattern[]).map(normalize) : []
  } catch {
    return []
  }
}

function writeAll(patterns: StudioPattern[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(patterns))
  } catch {}
}

export function loadPattern(id: string): StudioPattern | null {
  return loadPatterns().find((p) => p.id === id) ?? null
}

export function savePattern(pattern: StudioPattern) {
  const all = loadPatterns()
  const i = all.findIndex((p) => p.id === pattern.id)
  if (i === -1) all.unshift(pattern)
  else all[i] = pattern
  writeAll(all)
}

export function deletePattern(id: string) {
  writeAll(loadPatterns().filter((p) => p.id !== id))
}

export function createPattern(): StudioPattern {
  const pattern: StudioPattern = {
    ...defaults(),
    id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    updatedAt: Date.now(),
  }
  savePattern(pattern)
  return pattern
}

// ── Sizes ────────────────────────────────────────────────────────────────────

/** The size the maker usually starts from: M, or the middle of their range */
export function baseSize(sizes: StandardSize[]): StandardSize {
  if (sizes.length === 0 || sizes.includes('M')) return 'M'
  return sizes[Math.floor((sizes.length - 1) / 2)]
}

/** Sigrid's standard body measurements, as a starting point for a size chart */
export const standardBody = (size: StandardSize): BodySize => {
  const m = standardSizes[size]
  return { bust: m.bust, waist: m.waist, hips: m.hips }
}

/** Sizes in the usual order */
export const sortSizes = (sizes: StandardSize[]) => allSizes.filter((s) => sizes.includes(s))

/** Keeps derived values in step: each piece's drawn outline is its base-size outline */
export function withDerived(p: StudioPattern): StudioPattern {
  const base = baseSize(p.sizes)
  return {
    ...p,
    pieces: p.pieces.map((piece) => {
      const b = piece.bySize[base]
      const w = b?.width ?? 0
      return { ...piece, shape: 'rectangle', dims: { topWidth: w, bottomWidth: w, height: b?.length ?? 0 } }
    }),
  }
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step

/**
 * Estimates the other sizes from one filled-in size, using the size chart:
 * widths grow with the body's girth, lengths with height. The maker checks them.
 */
export function gradeFrom(p: StudioPattern, from: StandardSize, size: StandardSize) {
  const body = (s: StandardSize) => {
    const c = p.sizeChart[s]
    const std = standardBody(s)
    return { bust: c?.bust ?? std.bust!, hips: c?.hips ?? std.hips! }
  }
  const girth = (s: StandardSize) => (body(s).bust + body(s).hips) / 2
  return {
    width: (w: number) => roundTo((w * girth(size)) / girth(from), 0.5),
    length: (l: number) => roundTo((l * standardSizes[size].height) / standardSizes[from].height, 0.5),
    meters: (m: number) => roundTo((m * girth(size)) / girth(from), 0.1),
  }
}

/** A size with every number filled in */
export const bodyDone = (b?: BodySize) => !!b && !!b.bust && !!b.waist && !!b.hips
export const pieceSizeDone = (s?: PieceSize) => !!s && !!s.width && !!s.length

/** The guide as a sewer gets it, for the real guide components */
export function toGuide(pattern: Pick<StudioPattern, 'id' | 'pieces' | 'steps' | 'seamAllowance'>): GarmentGuide {
  return {
    garmentId: pattern.id,
    pieces: pattern.pieces.filter(isDrawable).map((p) => ({ ...p, seamAllowance: pattern.seamAllowance })),
    steps: pattern.steps,
  }
}

/** A piece needs a width and a height before it can be drawn */
export const isDrawable = (p: StudioPiece) => p.dims.height > 0 && Math.max(p.dims.topWidth, p.dims.bottomWidth) > 0

// ── What's still missing before the pattern can be sold ──────────────────────

export type Part = 'about' | 'materials' | 'pieces' | 'steps'

export function missingIn(p: StudioPattern): Record<Part, string[]> {
  const about: string[] = []
  if (!p.name.trim() || p.name === 'Untitled pattern') about.push('a name')
  if (!p.description.trim()) about.push('a description')
  if (!p.estimatedTime.trim()) about.push('the sewing time')
  if (!p.price) about.push('a price')
  if (p.sizes.length === 0) about.push('the sizes')
  const materials: string[] = []
  if (!p.fabric.name.trim()) materials.push('the fabric')
  if (p.sizes.some((sz) => !p.fabric.metersBySize[sz])) materials.push('how much fabric for every size')
  const pieces = p.pieces.length === 0 ? ['at least one piece'] : p.pieces.some((x) => !isDrawable(x)) ? ['the size of every piece'] : []
  const steps: string[] = []
  if (p.steps.length === 0) steps.push('the steps')
  else if (p.steps.some((s) => !s.title.trim() || !s.instruction.trim())) steps.push('an instruction for every step')
  return { about, materials, pieces, steps }
}

// ── Assistant output → studio data ───────────────────────────────────────────

function pieceFromDraft(p: DeepPartial<DraftPiece> | undefined): StudioPiece | null {
  if (!p?.id || !p.name || !p.height || !(p.topWidth || p.bottomWidth)) return null
  const top = p.topWidth ?? p.bottomWidth ?? 0
  const bottom = p.bottomWidth ?? top
  return {
    id: p.id,
    label: p.label ?? '?',
    name: p.name,
    shape: p.shape ?? (top === bottom ? 'rectangle' : 'trapezoid'),
    bySize: { M: { width: top, length: p.height } },
    dims: { topWidth: top, bottomWidth: bottom, height: p.height },
    quantity: p.quantity ?? 1,
    grainLine: p.grainLine ?? 'vertical',
    seamAllowance: p.seamAllowance ?? 1.5,
  }
}

function stepFromDraft(s: DeepPartial<DraftStep> | undefined, id: number): StudioStep | null {
  if (!s?.title || !s.action) return null
  const a = s.annotation
  return {
    id,
    group: s.group || 'Steps',
    action: s.action,
    title: s.title,
    instruction: s.instruction ?? '',
    pieceId: s.pieceId,
    secondPieceId: s.secondPieceId,
    fabricSide: s.fabricSide,
    annotation: a?.type ? { type: a.type, edge: a.edge, amount: a.amount, label: a.label } : undefined,
    tool: s.tool,
    measurement: s.measurement,
    tip: s.tip,
    review: s.review,
  }
}

/** Reads a (possibly still streaming) draft. Unfinished items at the end are left out. */
export function fromDraft(draft: DeepPartial<GuideDraft> | undefined): { pieces: StudioPiece[]; steps: StudioStep[] } {
  const pieces = (draft?.pieces ?? []).map(pieceFromDraft).filter((p): p is StudioPiece => !!p)
  const steps = (draft?.steps ?? [])
    .map((s, i) => stepFromDraft(s, i + 1))
    .filter((s): s is StudioStep => !!s)
  return { pieces, steps }
}

/** The pattern as the assistant reads it */
export function toRequestPattern(p: StudioPattern): WriteRequest['pattern'] {
  return {
    name: p.name,
    category: p.category,
    difficulty: p.difficulty,
    pieces: p.pieces.map(({ dims, bySize: _bySize, ...rest }) => (void _bySize, { ...rest, ...dims })),
    steps: p.steps.map(({ id, ...rest }) => (void id, rest)),
  }
}

// ── Manual editing ───────────────────────────────────────────────────────────

export interface Section {
  group: string
  /** Indices into steps, in order */
  indices: number[]
}

/** Runs of consecutive steps that share a group, as the maker wrote them */
export function sectionsOf(steps: StudioStep[]): Section[] {
  const out: Section[] = []
  steps.forEach((s, i) => {
    const last = out[out.length - 1]
    if (last && last.group === s.group) last.indices.push(i)
    else out.push({ group: s.group, indices: [i] })
  })
  return out
}

const nextId = (steps: StudioStep[]) => steps.reduce((m, s) => Math.max(m, s.id), 0) + 1

/** The kind of step, read from the title's first word: "Pin the side seams" is a pin step */
export function actionFromTitle(title: string, fallback: StudioStep['action']): StudioStep['action'] {
  const w = title.trim().toLowerCase()
  if (/^(cut|trim|clip|snip|notch)\b/.test(w)) return 'cut'
  if (/^(mark|trace|draw|chalk|transfer)\b/.test(w)) return 'mark'
  if (/^(fold|turn|roll)\b/.test(w)) return 'fold'
  if (/^(pin|clip|baste|tack)\b/.test(w)) return 'pin'
  if (/^(press|iron|steam)\b/.test(w)) return 'press'
  if (/^(attach|join|add|insert|set in)\b/.test(w)) return 'attach'
  if (/^(sew|stitch|topstitch|understitch|zigzag|overlock|serge|hem|finish)\b/.test(w)) return 'sew'
  if (/^(wash|prewash|prepare|lay|gather|check|measure|choose|print)\b/.test(w)) return 'prepare'
  return fallback
}

export function blankStep(steps: StudioStep[], group: string): StudioStep {
  // Start from the kind the section suggests; the maker can change it
  const action = /prepar/i.test(group) ? 'prepare' : /cut/i.test(group) ? 'cut' : /press|finish/i.test(group) ? 'press' : 'sew'
  return { id: nextId(steps), group, action, title: 'New step', instruction: '' }
}

export function insertStep(steps: StudioStep[], at: number, group: string): StudioStep[] {
  const next = [...steps]
  next.splice(at, 0, blankStep(steps, group))
  return next
}

/**
 * Moves a step one place. At the edge of a section it first joins the
 * neighbouring section (it stays put on screen but changes section), so a step
 * can travel anywhere one press at a time.
 */
export function moveStep(steps: StudioStep[], index: number, dir: -1 | 1): { steps: StudioStep[]; index: number } {
  const target = index + dir
  if (target < 0 || target >= steps.length) return { steps, index }
  const next = [...steps]
  if (next[target].group !== next[index].group) {
    next[index] = { ...next[index], group: next[target].group }
    return { steps: next, index }
  }
  ;[next[index], next[target]] = [next[target], next[index]]
  return { steps: next, index: target }
}

export function renameSection(steps: StudioStep[], section: Section, name: string): StudioStep[] {
  const set = new Set(section.indices)
  return steps.map((s, i) => (set.has(i) ? { ...s, group: name } : s))
}

export function newPiece(pieces: StudioPiece[]): StudioPiece {
  const label = String.fromCharCode(65 + (pieces.length % 26))
  let n = pieces.length + 1
  while (pieces.some((p) => p.id === `piece-${n}`)) n++
  return {
    id: `piece-${n}`,
    label,
    name: 'New piece',
    shape: 'rectangle',
    bySize: {},
    dims: { topWidth: 0, bottomWidth: 0, height: 0 },
    quantity: 1,
    grainLine: 'vertical',
    seamAllowance: 1.5,
  }
}

export const EXAMPLE_NOTES = `Simple tote bag, beginner.

Pieces (1 cm seam allowance included):
A  Bag body, cut 2, 40 x 45 cm
B  Strap, cut 2, 8 x 65 cm

Prewash and press the cotton canvas. Fold in half, cut both bodies and both straps.

Straps: fold in half lengthwise wrong sides together and press. Open, fold both long edges into the centre crease, press, fold again and topstitch 2 mm from both edges.

Body: right sides together, sew the sides and the bottom at 1 cm. Zigzag the raw edges. Box the bottom corners 5 cm.

Top: fold 1 cm then 3 cm to the wrong side and press. Tuck the strap ends under the hem 10 cm from each side seam and pin. Topstitch the hem at 2.5 cm, then sew a box with an X over each strap end. Press.`
