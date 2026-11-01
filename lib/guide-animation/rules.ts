/**
 * Which animation a guide step gets. Read from the step itself, so it works for every guide and for
 * patterns from the studio without anyone choosing an animation. The table is in DESIGN.md ("Guide
 * animations"): change one, change the other.
 *
 * This file only decides what happens; ./scenes.ts draws it.
 */
import type { GuidePiece, PieceEdge, SewingStep2D } from '@/lib/types'

export type StitchKind = 'stitch' | 'top' | 'baste' | 'tack' | 'zigzag' | 'overlock' | 'blind' | 'satin'
export type CutMode = 'fold' | 'pair' | 'single'

export type Plan =
  | { kind: 'none' }
  | { kind: 'wash' }
  | { kind: 'fold-fabric' }
  | { kind: 'settle' }
  /** `only` when a separate step does the other half: chalk in one, scissors in the next */
  | { kind: 'cut'; mode: CutMode; quantity: number; only?: 'draw' | 'cut' }
  | { kind: 'fold'; edges: PieceEdge[]; widths: number[]; press: boolean; pin: boolean }
  | { kind: 'press'; edges?: PieceEdge[] }
  | { kind: 'pin'; edges?: PieceEdge[] }
  | { kind: 'sew'; edges?: PieceEdge[]; stitch: StitchKind; inset: number; close: boolean; rows: number; hand: boolean }
  | { kind: 'dart'; edge: PieceEdge }
  | { kind: 'marks'; edge: PieceEdge; count: number }
  | { kind: 'buttons'; edge: PieceEdge; count: number }

const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
const number = (s: string) => WORDS[s.toLowerCase()] ?? Number(s)
const COUNT = '(\\d+|two|three|four|five|six|seven|eight|nine|ten)'

/** Everything a step says, to read the plain words in it */
const wordsOf = (s: SewingStep2D) => `${s.title}. ${s.instruction ?? ''}. ${s.measurement ?? ''}. ${s.annotation?.label ?? ''}`

/** "0.5 + 1 cm" or "6 mm double fold": the width of each fold, in cm */
export function foldWidths(s: SewingStep2D): number[] {
  const text = `${s.annotation?.label ?? ''} ${s.measurement ?? ''}`
  const toCm = (n: string, unit?: string) => (unit === 'mm' ? Number(n) / 10 : Number(n))
  const two = text.match(/(\d+(?:\.\d+)?)\s*(mm|cm)?\s*\+\s*(\d+(?:\.\d+)?)\s*(mm|cm)?/)
  if (two) return [toCm(two[1], two[2] ?? two[4]), toCm(two[3], two[4])]
  const double = text.match(/(\d+(?:\.\d+)?)\s*(mm|cm)\s*double/)
  if (double) return [toCm(double[1], double[2]), toCm(double[1], double[2])]
  const one = text.match(/(\d+(?:\.\d+)?)\s*(mm|cm)\s*fold/)
  if (one) return [toCm(one[1], one[2])]
  return [s.annotation?.amount ?? 1.5]
}

/** How the pattern lies on the fabric. Half on the fold, two loose pieces in the far corner, or one layer. */
export function cutMode(s: SewingStep2D, piece: GuidePiece | undefined): CutMode {
  const text = wordsOf(s)
  if (piece?.outline?.onFold || /\bon the fold\b/i.test(text)) return 'fold'
  if ((piece?.quantity ?? 1) > 1 && piece?.material !== 'interfacing') return 'pair'
  if (/\bboth layers\b|left and a right|\(cut 2\)|mirrored pair/i.test(`${text} ${piece?.name ?? ''}`)) return 'pair'
  return 'single'
}

/** How many of a piece the pattern asks for */
export function quantityOf(piece: GuidePiece | undefined, s: SewingStep2D): number {
  if (piece?.quantity) return piece.quantity
  const named = piece?.name?.match(/cut (\d+)/i)
  if (named) return Number(named[1])
  const said = s.title.match(new RegExp(`^cut (?:the )?${COUNT}\\b`, 'i'))
  return said ? number(said[1]) : /\bfronts\b|\bsleeves\b|\bfacings\b/i.test(s.title) ? 2 : 1
}

/** Stitches are named by what they do: thin, small, and always the right kind for the job */
export function stitchOf(s: SewingStep2D): StitchKind {
  const text = wordsOf(s)
  if (/buttonhole/i.test(text)) return 'satin'
  if (/zigzag/i.test(text)) return 'zigzag'
  if (/overlock|serge/i.test(text)) return 'overlock'
  if (/blind hem/i.test(text)) return 'blind'
  if (/\bbaste|longest stitch|long stitches|gather/i.test(text)) return 'baste'
  if (/topstitch|close to the .*fold|understitch/i.test(text)) return 'top'
  if (isByHand(s)) return 'tack'
  return 'stitch'
}
const isByHand = (s: SewingStep2D) => /\bby hand\b|hand-sew|slip stitch/i.test(wordsOf(s))

/** Which edges a step works on: its annotation, or what its words say */
function edgesOf(s: SewingStep2D): PieceEdge[] | undefined {
  if (s.annotation?.edge) return [s.annotation.edge]
  const text = wordsOf(s)
  if (/\bhem\b|\bhems\b/i.test(s.title)) return ['bottom']
  if (/both (?:centre )?(?:front )?edges|front edges|placket/i.test(text)) return ['right', 'left']
  return undefined
}

/**
 * Which edge folds, and how far. Folded in half, the top comes down onto the bottom, so the raw edges
 * end up together at the bottom, ready to sew to the next piece. (`widths` empty means half the piece.)
 */
function foldShape(s: SewingStep2D): { edges: PieceEdge[]; widths: number[] } {
  if (/\bin half\b/i.test(wordsOf(s))) return { edges: ['top'], widths: [] }
  return { edges: edgesOf(s) ?? ['bottom'], widths: foldWidths(s) }
}

/** The one rule for each step. Nothing here knows about any particular garment. */
export function planStep(s: SewingStep2D, index: number, steps: SewingStep2D[], pieces: GuidePiece[]): Plan {
  const piece = pieces.find((p) => p.id === s.pieceId?.split('#')[0])
  const text = wordsOf(s)
  const next = steps[index + 1]
  const prev = steps[index - 1]

  switch (s.action) {
    case 'prepare':
      if (s.pieceId) return { kind: 'settle' }
      if (/\bwash\b/i.test(s.title)) return { kind: 'wash' }
      if (/\bfold\b|\blay out\b/i.test(text)) return { kind: 'fold-fabric' }
      if (/\bhang\b/i.test(text)) return { kind: 'settle' }
      return { kind: 'none' }

    case 'cut': {
      if (!piece) return { kind: 'none' }
      const drawnBefore = prev?.action === 'mark' && prev.pieceId === s.pieceId
      return { kind: 'cut', mode: cutMode(s, piece), quantity: quantityOf(piece, s), only: drawnBefore ? 'cut' : undefined }
    }

    case 'mark': {
      if (next?.action === 'cut' && next.pieceId === s.pieceId) return { kind: 'cut', mode: cutMode(next, piece), quantity: quantityOf(piece, next), only: 'draw' }
      const count = text.match(new RegExp(`${COUNT}\\s+(?:loops?|marks?|buttons?|buttonholes?|points?)`, 'i')) ?? text.match(new RegExp(`mark ${COUNT}\\b`, 'i'))
      return { kind: 'marks', edge: s.annotation?.edge ?? 'right', count: count ? number(count[1]) : 4 }
    }

    case 'fold':
      return { kind: 'fold', ...foldShape(s), press: /\bpress\b/i.test(text), pin: /\bpin\b/i.test(text) }

    case 'press':
      // Pressing a fold into an edge is folding; pressing what's sewn is ironing
      if (/\bfold(?:ed)?\b|\bhems?\b/i.test(s.title) && !/\bseam\b/i.test(s.title)) return { kind: 'fold', ...foldShape(s), press: true, pin: false }
      return { kind: 'press', edges: edgesOf(s) }

    case 'pin':
      return { kind: 'pin', edges: edgesOf(s) }

    case 'sew':
    case 'attach': {
      if (/\bbuttons?\b/i.test(s.title) && !/buttonhole/i.test(s.title)) {
        const count = text.match(new RegExp(`${COUNT}\\s+(?:small\\s+)?(?:\\w+\\s+)?buttons?`, 'i'))
        return { kind: 'buttons', edge: s.annotation?.edge ?? 'left', count: count ? number(count[1]) : 4 }
      }
      if (/\bdarts?\b/i.test(s.title)) return { kind: 'dart', edge: s.annotation?.edge ?? 'left' }
      const close = /close to|inner fold|upper fold/i.test(text) || (s.annotation?.amount ?? 1) <= 0.3
      return { kind: 'sew', edges: edgesOf(s), stitch: stitchOf(s), inset: s.annotation?.amount ?? 1.5, close, rows: /two rows/i.test(text) ? 2 : 1, hand: isByHand(s) }
    }

    default:
      return { kind: 'none' }
  }
}
