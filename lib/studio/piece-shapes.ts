import type { StudioPiece } from './patterns'
import { standardSizes } from '@/lib/data'
import type { StandardSize } from '@/lib/types'

/**
 * Ready-made starting shapes for a pattern piece. Picking one fills in the lines, curves and
 * neckline, with numbers for every size of the pattern, so the maker only adjusts them.
 *
 * The numbers come from Sigrid's size chart (bust, waist, hips, height, inseam per size, in line
 * with common European charts, EN 13402) plus typical ease, and from standard sewing tables for
 * the parts a size chart doesn't list (back width, armhole depth, upper arm). Each piece is a
 * front piece, measured flat across, not cut on the fold.
 */
export interface PieceShapeStart {
  id: string
  name: string
  /** Suggested piece name */
  pieceName: string
  neckline?: 'straight' | 'scoop'
  necklineDepth?: (size: StandardSize) => number
  lines: { label: string; curveBelow?: number }[]
  /** For one size: each line's cm from the top and cm across */
  numbers: (size: StandardSize) => { down: number; width: number }[]
}

// Body parts a bust/waist/hips chart doesn't give, per size (cm)
const backWidth: Record<StandardSize, number> = { XXS: 34.5, XS: 36, S: 37.5, M: 40, L: 42.5, XL: 44.5, XXL: 45.5 }
const armholeDepth: Record<StandardSize, number> = { XXS: 15.5, XS: 16, S: 17, M: 18, L: 19.5, XL: 20.5, XXL: 21.5 }
const upperArm: Record<StandardSize, number> = { XXS: 24.5, XS: 26, S: 27.5, M: 29, L: 31, XL: 33, XXL: 35.5 }

const half = (n: number) => Math.round(n * 2) / 2
const body = (s: StandardSize) => standardSizes[s]
/** Lengths grow with height, relative to size M */
const tall = (s: StandardSize, atM: number) => half((atM * body(s).height) / body('M').height)

export const PIECE_SHAPES: PieceShapeStart[] = [
  {
    id: 'rectangle',
    name: 'Rectangle',
    pieceName: 'Panel',
    lines: [{ label: 'Top' }, { label: 'Bottom' }],
    numbers: () => [
      { down: 0, width: 40 },
      { down: 60, width: 40 },
    ],
  },
  {
    // A front bodice: shoulders at back width, chest at half the bust plus ease, hem over the hips
    id: 'top',
    name: 'Top',
    pieceName: 'Front',
    neckline: 'scoop',
    necklineDepth: (s) => half(7 + allIndex(s) * 0.4),
    lines: [{ label: 'Shoulders', curveBelow: -4 }, { label: 'Underarm' }, { label: 'Hem' }],
    numbers: (s) => [
      { down: 0, width: half(backWidth[s] - 4) },
      { down: armholeDepth[s], width: half(body(s).bust / 2 + 2) },
      { down: tall(s, 62), width: half(body(s).hips / 2 + 1) },
    ],
  },
  {
    // An A-line skirt front: waist and hips at half plus a little ease, flaring 12 cm to the hem
    id: 'skirt',
    name: 'Skirt',
    pieceName: 'Skirt front',
    lines: [{ label: 'Waist', curveBelow: 3 }, { label: 'Hips' }, { label: 'Hem' }],
    numbers: (s) => [
      { down: 0, width: half(body(s).waist / 2 + 1) },
      { down: tall(s, 20), width: half(body(s).hips / 2 + 1) },
      { down: tall(s, 60), width: half(body(s).hips / 2 + 13) },
    ],
  },
  {
    // A set-in sleeve: a narrow cap top, the upper arm plus ease, tapering to the cuff
    id: 'sleeve',
    name: 'Sleeve',
    pieceName: 'Sleeve',
    lines: [{ label: 'Top', curveBelow: 5 }, { label: 'Underarm' }, { label: 'Cuff' }],
    numbers: (s) => [
      { down: 0, width: 12 },
      { down: half(13 + allIndex(s) * 0.5), width: half(upperArm[s] + 10) },
      { down: tall(s, 45), width: half((upperArm[s] + 10) * 0.7) },
    ],
  },
  {
    // A front trouser leg: a quarter of the waist and hips plus ease, crotch depth from the hips
    id: 'trousers',
    name: 'Trouser leg',
    pieceName: 'Front leg',
    lines: [{ label: 'Waist', curveBelow: 2 }, { label: 'Crotch' }, { label: 'Hem' }],
    numbers: (s) => {
      const crotchDepth = half(body(s).hips * 0.29)
      return [
        { down: 0, width: half(body(s).waist / 4 + 6.5) },
        { down: crotchDepth, width: half(body(s).hips / 4 + 8) },
        { down: half(body(s).inseam + crotchDepth), width: half(20 + allIndex(s) * 0.5) },
      ]
    },
  },
]

const ORDER: StandardSize[] = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
function allIndex(s: StandardSize) {
  return ORDER.indexOf(s)
}

/** The piece with a starting shape filled in for every given size */
export function applyShape(piece: StudioPiece, shape: PieceShapeStart, sizes: StandardSize[]): StudioPiece {
  const stamp = Date.now().toString(36)
  const lines = shape.lines.map((l, i) => ({ id: `l${i}-${stamp}`, label: l.label, curveBelow: l.curveBelow }))
  const forSizes = sizes.length ? sizes : (['M'] as StandardSize[])
  const base: StandardSize = forSizes.includes('M') ? 'M' : forSizes[Math.floor((forSizes.length - 1) / 2)]
  return {
    ...piece,
    name: piece.name === 'New piece' ? shape.pieceName : piece.name,
    neckline: shape.neckline ?? 'straight',
    necklineDepth: shape.necklineDepth ? shape.necklineDepth(base) : null,
    lines,
    bySize: Object.fromEntries(
      forSizes.map((size) => {
        const nums = shape.numbers(size)
        return [size, Object.fromEntries(lines.map((l, i) => [l.id, nums[i]]))]
      }),
    ),
  }
}

/** Nothing typed yet in any size */
export const isBlankPiece = (piece: StudioPiece) =>
  Object.values(piece.bySize).every((row) => Object.values(row ?? {}).every((v) => !v.width && !v.down))
