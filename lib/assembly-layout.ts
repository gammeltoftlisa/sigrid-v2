import { outlineSize, type PieceOutline } from './piece-outline'
import { pieceOf, type AssemblyMember } from './assembly'
import type { GuidePiece, JoinKind, PieceDims, UserMeasurements } from './types'

/** A piece where it lies in a joined set, in cm (x, y is its top left) */
export interface Placed {
  id: string
  piece: GuidePiece
  o: PieceOutline
  x: number
  y: number
  w: number
  h: number
  /** On the piece of a group that touches the set: how, and which piece it was sewn to */
  join?: { via: JoinKind; to: string }
}
type Box = { x: number; y: number; w: number; h: number }

const resolveDims = (piece: GuidePiece, m: UserMeasurements): PieceDims => (typeof piece.dims === 'function' ? piece.dims(m) : piece.dims)

/** A piece's outline: its real one, or a plain shape from its width and length */
export function outlineOf(piece: GuidePiece, m: UserMeasurements): PieceOutline {
  if (piece.outline && piece.outline.lines.length >= 2) return piece.outline
  const d = resolveDims(piece, m)
  return { lines: [{ down: 0, width: d.topWidth }, { down: d.height, width: d.bottomWidth }] }
}

/** Once cut, a piece cut on the fold is a whole piece: drawn opened out, twice as wide */
export const opened = (o: PieceOutline): PieceOutline =>
  o.onFold ? { ...o, onFold: false, lines: o.lines.map((l) => ({ ...l, width: l.width * 2 })) } : o

export const boxOf = (items: Box[]): Box => {
  const x = Math.min(...items.map((i) => i.x))
  const y = Math.min(...items.map((i) => i.y))
  return { x, y, w: Math.max(...items.map((i) => i.x + i.w)) - x, h: Math.max(...items.map((i) => i.y + i.h)) - y }
}

/** The x the outline is drawn from, in cm from the piece's left: its centre line, or its straight edge for a half */
export const lineX = (p: Pick<Placed, 'o' | 'w'>) => (p.o.onFold ? (p.o.mirror ? p.w : 0) : p.w / 2)

/** Where a piece goes when it's attached to another, in cm (x, y is its top left) */
function attach(to: Box, w: number, h: number, via: JoinKind) {
  if (via === 'side') return { x: to.x + to.w, y: to.y }
  if (via === 'top') return { x: to.x + to.w / 2 - w / 2, y: to.y - h }
  // Laid on: a piece at least half as long lines up with the top (an overlay at the neckline,
  // a pocket bag hanging from its welt); a small one sits a little over halfway down (a welt)
  return h > to.h * 0.4 ? { x: to.x + to.w / 2 - w / 2, y: to.y } : { x: to.x + to.w / 2 - w / 2, y: to.y + to.h * 0.55 - h / 2 }
}

/** A piece drawn as one half of a pair: straight edge on the right (the left half) or the left */
function halfOf(p: Placed, leftHalf: boolean): Placed {
  const o = { ...p.o, onFold: true, mirror: leftHalf }
  return { ...p, o, w: outlineSize(o).width }
}

/**
 * Lays out a set of pieces in the order they were attached. Each group that was attached is
 * laid out on its own first, then moved so the piece that touches lands on the piece it was
 * sewn to, so pieces joined earlier keep their places. A piece's two cuts sewn side by side are
 * the two halves of one piece (a centre back seam): each is drawn as a half, meeting at the seam.
 */
export function layout(members: AssemblyMember[], pieces: GuidePiece[], m: UserMeasurements): Placed[] {
  const placed: Placed[] = []
  let i = 0
  while (i < members.length) {
    const mem = members[i]
    const n = i === 0 ? 1 : Math.max(1, mem.n ?? 1)
    if (i === 0 || !mem.via) {
      const piece = pieces.find((p) => p.id === pieceOf(mem.id))
      if (piece) {
        const o = opened(outlineOf(piece, m))
        const { width: w, height: h } = outlineSize(o)
        const at = placed.length === 0 ? { x: 0, y: 0 } : attach(boxOf(placed), w, h, 'side')
        placed.push({ id: mem.id, piece, o, x: at.x, y: at.y, w, h })
      }
      i += 1
      continue
    }
    const group = layout([{ id: mem.id }, ...members.slice(i + 1, i + n)], pieces, m)
    i += n
    if (group.length === 0) continue
    let contact = group.find((g) => g.id === mem.contact) ?? group[0]
    const ti = Math.max(0, placed.findIndex((g) => g.id === mem.to))
    const to = placed[ti]
    if (!to) continue
    const join = { via: mem.via, to: to.id }
    if (mem.via === 'side' && pieceOf(contact.id) === pieceOf(to.id) && !to.o.onFold && !contact.o.onFold) {
      const left = halfOf(to, true)
      placed[ti] = { ...left, x: to.x + to.w / 2 - left.w }
      const right = { ...halfOf(contact, false), join }
      group[group.indexOf(contact)] = right
      contact = right
      const at = { x: to.x + to.w / 2, y: to.y }
      placed.push(...group.map((g) => ({ ...g, x: g.x - contact.x + at.x, y: g.y - contact.y + at.y })))
      continue
    }
    group[group.indexOf(contact)] = { ...contact, join }
    const at = attach(to, contact.w, contact.h, mem.via)
    // Side by side, the touching piece meets its partner; on top or above, the group is centred
    const gb = boxOf(group)
    const dx = mem.via === 'side' ? at.x - contact.x : to.x + to.w / 2 - (gb.x + gb.w / 2)
    const dy = at.y - contact.y
    placed.push(...group.map((g) => ({ ...g, x: g.x + dx, y: g.y + dy })))
  }
  return placed
}
