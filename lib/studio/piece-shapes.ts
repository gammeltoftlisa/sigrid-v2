import type { SideCurve, StudioPiece } from './patterns'
import type { StandardSize } from '@/lib/types'

/**
 * Ready-made starting shapes for a pattern piece, with typical numbers for size M.
 * Picking one fills in the lines, curves and neckline, so the maker only adjusts numbers.
 */
export interface PieceShapeStart {
  id: string
  name: string
  /** Suggested piece name */
  pieceName: string
  neckline?: 'straight' | 'scoop'
  necklineDepth?: number
  lines: { label: string; down: number; width: number; curveBelow?: SideCurve }[]
}

export const PIECE_SHAPES: PieceShapeStart[] = [
  {
    id: 'rectangle',
    name: 'Rectangle',
    pieceName: 'Panel',
    lines: [
      { label: 'Top', down: 0, width: 40 },
      { label: 'Bottom', down: 60, width: 40 },
    ],
  },
  {
    id: 'top',
    name: 'Top',
    pieceName: 'Front',
    neckline: 'scoop',
    necklineDepth: 8,
    lines: [
      { label: 'Shoulders', down: 0, width: 36, curveBelow: 'in' },
      { label: 'Underarm', down: 20, width: 46 },
      { label: 'Hem', down: 62, width: 48 },
    ],
  },
  {
    id: 'skirt',
    name: 'Skirt',
    pieceName: 'Skirt front',
    lines: [
      { label: 'Waist', down: 0, width: 36, curveBelow: 'out' },
      { label: 'Hips', down: 20, width: 48 },
      { label: 'Hem', down: 60, width: 60 },
    ],
  },
  {
    id: 'sleeve',
    name: 'Sleeve',
    pieceName: 'Sleeve',
    lines: [
      { label: 'Top', down: 0, width: 12, curveBelow: 'out' },
      { label: 'Underarm', down: 14, width: 40 },
      { label: 'Cuff', down: 45, width: 28 },
    ],
  },
  {
    id: 'trousers',
    name: 'Trouser leg',
    pieceName: 'Front leg',
    lines: [
      { label: 'Waist', down: 0, width: 24, curveBelow: 'out' },
      { label: 'Crotch', down: 28, width: 32 },
      { label: 'Hem', down: 100, width: 22 },
    ],
  },
]

/** The piece with a starting shape filled in for one size; other sizes start empty */
export function applyShape(piece: StudioPiece, shape: PieceShapeStart, size: StandardSize): StudioPiece {
  const lines = shape.lines.map((l, i) => ({ id: `l${i}-${Date.now().toString(36)}`, label: l.label, curveBelow: l.curveBelow }))
  return {
    ...piece,
    name: piece.name === 'New piece' ? shape.pieceName : piece.name,
    neckline: shape.neckline ?? 'straight',
    necklineDepth: shape.necklineDepth ?? null,
    lines,
    bySize: { [size]: Object.fromEntries(lines.map((l, i) => [l.id, { down: shape.lines[i].down, width: shape.lines[i].width }])) },
  }
}

/** Nothing typed yet in any size */
export const isBlankPiece = (piece: StudioPiece) =>
  Object.values(piece.bySize).every((row) => Object.values(row ?? {}).every((v) => !v.width && !v.down))
