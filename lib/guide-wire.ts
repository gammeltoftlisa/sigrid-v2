import { standardSizes } from './data'
import { allSizes } from './sizes'
import type { GarmentGuide, GuidePiece, PieceDims, StandardSize, UserMeasurements } from './types'

/**
 * A guide as it travels from the server. A piece's size can be a function of the body's measurements,
 * which JSON can't carry, so its result for every standard size goes instead. Sewers always work in
 * a standard size, so that's every number the pages can ask for.
 */
type WireDims = PieceDims | { bySize: Record<StandardSize, PieceDims> }
export type WireGuide = Omit<GarmentGuide, 'pieces'> & { pieces: (Omit<GuidePiece, 'dims'> & { dims: WireDims })[] }

export function packGuide(guide: GarmentGuide): WireGuide {
  return {
    ...guide,
    pieces: guide.pieces.map((piece) => {
      const { dims } = piece
      if (typeof dims !== 'function') return { ...piece, dims }
      return { ...piece, dims: { bySize: Object.fromEntries(allSizes.map((s) => [s, dims(standardSizes[s])])) as Record<StandardSize, PieceDims> } }
    }),
  }
}

/** The standard size closest to these measurements */
function closestSize(m: UserMeasurements): StandardSize {
  const distance = (s: StandardSize) => Math.abs(standardSizes[s].bust - m.bust) + Math.abs(standardSizes[s].hips - m.hips) + Math.abs(standardSizes[s].height - m.height)
  return allSizes.reduce((best, s) => (distance(s) < distance(best) ? s : best))
}

export function unpackGuide(wire: WireGuide): GarmentGuide {
  return {
    ...wire,
    pieces: wire.pieces.map((piece) => {
      const { dims } = piece
      if (!('bySize' in dims)) return { ...piece, dims }
      return { ...piece, dims: (m: UserMeasurements) => dims.bySize[closestSize(m)] }
    }),
  }
}
