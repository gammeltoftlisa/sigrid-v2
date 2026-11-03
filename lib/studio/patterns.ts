import type { Difficulty, GarmentCategory, GarmentGuide, PieceDims, SewingStep2D, StandardSize } from '@/lib/types'
import type { Tool } from '@/components/sewing/tools'
import type { PieceOutline } from '@/lib/piece-outline'
import { standardSizes } from '@/lib/data'
import { allSizes } from '@/lib/sizes'
import {
  announceStorageProblem,
  keepCorruptCopy,
  readJson,
  readRaw,
  removeRaw,
  storedKeys,
  tryWriteRaw,
  writeRaw,
  type WriteResult,
} from '@/lib/local-store'
import type { DeepPartial } from 'ai'
import { z } from 'zod'
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

/**
 * A pattern piece is described from top to bottom by measurement lines
 * ("Shoulder", "Bust", "Waist", "Hem"): for each size, how far down from the
 * top edge the line is and how wide the piece is there. The outline is drawn
 * through those widths, mirrored around the middle.
 */
export interface PieceLine {
  id: string
  label: string
  /**
   * How much the side bows between this line and the next, in cm at its middle:
   * positive bows out (hips, a sleeve cap), negative bows in (an armhole, a waist), 0 or unset is straight
   */
  curveBelow?: number | null
}

/** A curve in cm; older patterns saved "in" / "out" */
export const curveCm = (c: unknown): number => (typeof c === 'number' ? c : c === 'in' ? -3 : c === 'out' ? 3 : 0)

export interface LineSize {
  /** cm from the top edge; the first line is the top edge itself (0) */
  down: number | null
  /** Width of the piece at this line, in cm */
  width: number | null
}

/** The lines every new piece starts with */
export const TOP_LINE = 'top'
export const BOTTOM_LINE = 'bottom'

export interface StudioPiece {
  id: string
  label: string
  name: string
  shape: 'rectangle' | 'trapezoid'
  /** Cut on the fold: the drawing shows the half piece, with the fold on the left */
  onFold: boolean
  /** The top edge: straight, or scooped down in the middle (a neckline) */
  neckline?: 'straight' | 'scoop'
  /** How deep the scoop is at the middle, in cm */
  necklineDepth?: number | null
  /** Measurement lines, top to bottom */
  lines: PieceLine[]
  /** For every size: each line's position and width */
  bySize: PerSize<Record<string, LineSize>>
  /** The outline drawn in the guide: the base size, kept in step by withDerived() */
  dims: PieceDims
  quantity: number
  /** Cut from interfacing instead of the main fabric */
  material?: 'fabric' | 'interfacing'
  grainLine: 'vertical' | 'horizontal'
  seamAllowance: number
  /** Derived by withDerived(): the base size's real outline, for the sewer's guide */
  outline?: PieceOutline
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
  /** When it was published: it's in Explore with its own product page until unpublished (edits show live) */
  publishedAt?: number | null
  /** The cover photo of the made garment (the first of `photos`), shown on the pattern list; optional */
  photo?: string
  /** Every photo of the made garment, the cover first. Set both through setPhotos() */
  photos?: string[]
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
  /** The icon chosen for each section, by section name (see components/studio/section-icons) */
  sectionIcons: Record<string, string>
  messages: StudioMessage[]
  status: 'draft' | 'ready'
  updatedAt: number
}

const LEGACY_KEY = 'sigrid_studio_patterns'

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
  sectionIcons: {},
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
  p.pieces = p.pieces.map((piece) => {
    if (piece.lines) return piece
    // Older pieces were a width and a length per size: they become a top and a bottom line
    type Old = { width?: number | null; length?: number | null }
    const old = (piece.bySize ?? {}) as PerSize<Old>
    const fromDims = piece.dims?.height ? { [base]: { width: piece.dims.topWidth, length: piece.dims.height } } : {}
    const src: PerSize<Old> = Object.keys(old).length ? old : fromDims
    const bySize: PerSize<Record<string, LineSize>> = {}
    for (const [size, v] of Object.entries(src) as [StandardSize, Old][]) {
      bySize[size] = { [TOP_LINE]: { down: 0, width: v.width ?? null }, [BOTTOM_LINE]: { down: v.length ?? null, width: v.width ?? null } }
    }
    return { ...piece, onFold: false, lines: defaultLines(), bySize }
  })
  return withDerived(p)
}

// ── Saving ───────────────────────────────────────────────────────────────────
//
// Each pattern has its own key, and its photo another, so one unreadable pattern can't cost the
// others and typing doesn't rewrite a photo on every keystroke. Patterns that were saved together
// under LEGACY_KEY are moved over the first time they're read.

const patternKeyPrefix = 'sigrid_studio_pattern_'
const photoKeyPrefix = 'sigrid_studio_photo_'
export const patternKey = (id: string) => patternKeyPrefix + id
export const photoKey = (id: string) => photoKeyPrefix + id

/**
 * Deleted ids, so a second tab still showing a deleted pattern can't bring it back by saving.
 * A deletion only needs remembering while such a tab might be open, so the list stays short.
 */
const DELETED_KEY = 'sigrid_studio_deleted'
const MAX_DELETED = 200

/** Checks only what the code below relies on. normalize() fills in what older saves don't have. */
const savedPatternSchema = z.looseObject({
  id: z.string().min(1),
  updatedAt: z.number().optional(),
  sizes: z.array(z.string()).optional(),
  pieces: z.array(z.looseObject({})).optional(),
  steps: z.array(z.looseObject({})).optional(),
  fabric: z.looseObject({}).optional(),
  photo: z.string().optional(),
})

/** Null when this saved value can't become a pattern. Its key is left alone, so it isn't lost. */
function readSaved(value: unknown, photoRaw: string | null): StudioPattern | null {
  const parsed = savedPatternSchema.safeParse(value)
  if (!parsed.success) return null
  try {
    const saved = parsed.data as unknown as Saved
    const photos = readPhotos(photoRaw) ?? (saved.photo ? [saved.photo] : [])
    return normalize(photos.length ? { ...saved, photo: photos[0], photos } : saved)
  } catch {
    return null
  }
}

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

const deletedIds = (): string[] => {
  const result = readJson(DELETED_KEY, z.array(z.string()))
  return result.status === 'ok' ? result.value : []
}

/** The most photos one pattern keeps. They live in this browser's storage, which only holds a few megabytes. */
export const MAX_PHOTOS = 6

/** The cover and the list together, so they can't disagree */
export const setPhotos = (photos: string[]): Pick<StudioPattern, 'photo' | 'photos'> => {
  const kept = photos.filter(Boolean).slice(0, MAX_PHOTOS)
  return { photo: kept[0], photos: kept.length ? kept : undefined }
}

/** The photo key holds one photo (as saved before there could be more) or a list of them */
function readPhotos(raw: string | null): string[] | null {
  if (!raw) return null
  if (!raw.startsWith('[')) return [raw]
  const list = parseJson(raw)
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : null
}

/** Writes the two keys of one pattern. Keeps the photos out of the text, and skips what hasn't changed. */
function writeOne(pattern: StudioPattern, write: typeof writeRaw): WriteResult {
  const { photo: cover, photos: all, ...rest } = pattern
  const list = all?.length ? all : cover ? [cover] : []
  // One photo is saved as before, so older versions of the app still read it
  const photo = list.length === 0 ? '' : list.length === 1 ? list[0] : JSON.stringify(list)
  const text = JSON.stringify(rest)
  const key = patternKey(pattern.id)
  if (readRaw(key) !== text) {
    const result = write(key, text)
    if (!result.ok) return result
  }
  const pk = photoKey(pattern.id)
  if (!photo) removeRaw(pk)
  else if (readRaw(pk) !== photo) return write(pk, photo)
  return { ok: true }
}

/**
 * Moves the old all-in-one list to separate keys. The old list is removed first, because storage
 * may not have room for both; localStorage is synchronous, so if a write fails the list goes
 * straight back and nothing is lost. It's then still read by legacyPatterns().
 */
function migrateLegacy() {
  const raw = readRaw(LEGACY_KEY)
  if (raw === null) return
  const items = parseJson(raw)
  if (!Array.isArray(items)) {
    if (keepCorruptCopy(LEGACY_KEY, raw)) removeRaw(LEGACY_KEY)
    announceStorageProblem('unreadable')
    return
  }
  const patterns = items.map((item) => readSaved(item, null))
  const unreadable = items.filter((_, i) => !patterns[i])

  removeRaw(LEGACY_KEY)
  const written: string[] = []
  for (const p of patterns) {
    // Already moved, and maybe edited since: the separate key is the newer one
    if (!p || readRaw(patternKey(p.id)) !== null) continue
    written.push(p.id)
    if (!writeOne(p, tryWriteRaw).ok) {
      for (const id of written) {
        removeRaw(patternKey(id))
        removeRaw(photoKey(id))
      }
      tryWriteRaw(LEGACY_KEY, raw)
      return
    }
  }
  if (unreadable.length > 0) {
    keepCorruptCopy(LEGACY_KEY, JSON.stringify(unreadable))
    announceStorageProblem('unreadable')
  }
}

/** What's still in the old list because moving it failed; normally nothing */
function legacyPatterns(): StudioPattern[] {
  const raw = readRaw(LEGACY_KEY)
  const items = raw === null ? null : parseJson(raw)
  if (!Array.isArray(items)) return []
  return items.map((item) => readSaved(item, null)).filter((p): p is StudioPattern => !!p)
}

export function loadPatterns(): StudioPattern[] {
  migrateLegacy()
  const byId = new Map<string, StudioPattern>()
  for (const p of legacyPatterns()) byId.set(p.id, p)
  let unreadable = false
  for (const key of storedKeys(patternKeyPrefix)) {
    const id = key.slice(patternKeyPrefix.length)
    const p = readSaved(parseJson(readRaw(key) ?? ''), readRaw(photoKey(id)))
    if (p) byId.set(p.id, p)
    else unreadable = true
  }
  if (unreadable) announceStorageProblem('unreadable')
  for (const id of deletedIds()) byId.delete(id)
  // Ids start with the time they were made, so this is newest first, and editing doesn't reorder
  return [...byId.values()].sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
}

export function loadPattern(id: string): StudioPattern | null {
  return loadPatterns().find((p) => p.id === id) ?? null
}

/**
 * Saves one pattern, unless it has been deleted or another tab has saved something newer. Those
 * aren't failures: that tab's work is the one to keep, and this tab catches up from it.
 */
export function savePattern(pattern: StudioPattern): WriteResult {
  migrateLegacy()
  if (deletedIds().includes(pattern.id)) return { ok: true }
  const stored = readRaw(patternKey(pattern.id))
  const saved = stored === null ? null : savedPatternSchema.safeParse(parseJson(stored))
  if (saved?.success && (saved.data.updatedAt ?? 0) > pattern.updatedAt) return { ok: true }
  return writeOne(pattern, writeRaw)
}

export function deletePattern(id: string) {
  migrateLegacy()
  removeRaw(patternKey(id))
  removeRaw(photoKey(id))
  writeRaw(DELETED_KEY, JSON.stringify([...deletedIds().filter((d) => d !== id), id].slice(-MAX_DELETED)))
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
      const o = outline(piece, base)
      if (!o) return { ...piece, dims: { topWidth: 0, bottomWidth: 0, height: 0 } }
      const top = o[0].width
      const bottom = o[o.length - 1].width
      return {
        ...piece,
        shape: top === bottom ? 'rectangle' : 'trapezoid',
        dims: { topWidth: top, bottomWidth: bottom, height: o[o.length - 1].down },
        // The real shape, so the sewer's guide draws what the maker drew
        outline: {
          lines: o.map((l, k) => ({ down: l.down, width: l.width, curve: curveCm(piece.lines[k]?.curveBelow) })),
          onFold: piece.onFold,
          necklineDepth: piece.neckline === 'scoop' ? (piece.necklineDepth ?? 0) : 0,
        },
      }
    }),
  }
}

export const defaultLines = (): PieceLine[] => [
  { id: TOP_LINE, label: 'Top' },
  { id: BOTTOM_LINE, label: 'Hem' },
]

/** A line's numbers in one size; the top line always sits at 0 */
export function lineAt(piece: StudioPiece, size: StandardSize, lineId: string): LineSize {
  const v = piece.bySize[size]?.[lineId] ?? { down: null, width: null }
  return lineId === piece.lines[0]?.id ? { ...v, down: 0 } : v
}

/** Every line has a width, and every line below the top sits further down than the one above */
export function pieceSizeDone(piece: StudioPiece, size: StandardSize): boolean {
  let last = -1
  for (const line of piece.lines) {
    const v = lineAt(piece, size, line.id)
    if (!v.width || v.down === null || v.down <= last) return false
    last = v.down
  }
  return piece.lines.length >= 2
}

/** The piece's outline in one size, top to bottom, once it is complete */
export function outline(piece: StudioPiece, size: StandardSize): { label: string; down: number; width: number }[] | null {
  if (!pieceSizeDone(piece, size)) return null
  return piece.lines.map((l) => {
    const v = lineAt(piece, size, l.id)
    return { label: l.label, down: v.down!, width: v.width! }
  })
}

/** Fills the empty numbers in the other sizes from one finished size (widths by girth, positions by height) */
export function gradePiece(p: StudioPattern, piece: StudioPiece, from: StandardSize): StudioPiece {
  if (!pieceSizeDone(piece, from)) return piece
  const bySize = { ...piece.bySize }
  for (const size of p.sizes) {
    if (size === from) continue
    const g = gradeFrom(p, from, size)
    const row = { ...(bySize[size] ?? {}) }
    for (const line of piece.lines) {
      const src = lineAt(piece, from, line.id)
      const cur = row[line.id] ?? { down: null, width: null }
      row[line.id] = { down: cur.down ?? g.length(src.down!), width: cur.width ?? g.width(src.width!) }
    }
    bySize[size] = row
  }
  return { ...piece, bySize }
}

// toFixed(2) clears float noise like 2.3000000000000003
const roundTo = (n: number, step: number) => Number((Math.round(n / step) * step).toFixed(2))

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
    onFold: false,
    lines: defaultLines(),
    bySize: { M: { [TOP_LINE]: { down: 0, width: top }, [BOTTOM_LINE]: { down: p.height, width: bottom } } },
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
    pieces: p.pieces.map(({ dims, bySize: _b, lines: _l, onFold: _f, ...rest }) => (void [_b, _l, _f], { ...rest, ...dims })),
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

/**
 * Moves a step so it sits before position `to` (counted in the list before the
 * move; `steps.length` is the end) and joins `group`. Used by drag and drop and
 * by "Move to section".
 */
export function moveStepTo(steps: StudioStep[], from: number, to: number, group: string): { steps: StudioStep[]; index: number } {
  const moving = { ...steps[from], group }
  const rest = steps.filter((_, i) => i !== from)
  const at = to > from ? to - 1 : to
  rest.splice(at, 0, moving)
  return { steps: rest, index: at }
}

/** A copy of a step right after it */
export function duplicateStep(steps: StudioStep[], index: number): StudioStep[] {
  const next = [...steps]
  next.splice(index + 1, 0, { ...steps[index], id: nextId(steps) })
  return next
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
    onFold: false,
    // Own line ids per piece, so nothing about one piece's lines can carry over to another
    lines: defaultLines().map((l) => ({ ...l, id: `${l.id}-${n}` })),
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
