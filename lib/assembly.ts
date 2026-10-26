import type { JoinKind, SewingStep2D } from './types'

type StepPieces = Pick<SewingStep2D, 'pieceId' | 'pieceIds' | 'secondPieceId' | 'join'> & { action?: SewingStep2D['action'] }

/** The pieces a step is about: several when it joins them, else its one piece. "<id>#2" is a piece's second cut. */
export const stepPieceIds = (s: StepPieces): string[] =>
  s.pieceIds?.length ? s.pieceIds : [s.pieceId, s.secondPieceId].filter((id): id is string => !!id)

/** "B#2" → "B": the pattern piece a cut comes from */
export const pieceOf = (id: string) => id.split('#')[0]
export const isSecondCut = (id: string) => id.includes('#')

/**
 * One piece in a joined set. The first piece of each group that was attached carries how:
 * `via` the kind of join, `to` the piece it was sewn to, `contact` its own piece that touches
 * it, and `n` how many members came with it (they follow it, keeping their places).
 */
export interface AssemblyMember {
  id: string
  via?: JoinKind
  to?: string
  contact?: string
  n?: number
}

/** What a step shows: the set already sewn together, and the pieces joining it now */
export interface Assembly {
  base: AssemblyMember[]
  joining: AssemblyMember[][]
  join: JoinKind
  /** The base was joined in the last step or two, and the steps since only pinned, sewed or pressed it (so this step is about that seam) */
  recentJoin?: boolean
}

/**
 * What to draw for a step. Pieces joined in earlier steps stay together, each where it was
 * attached: if A and B were joined before and this step adds C, the base is A+B and C joins it.
 * A step about one piece that's already part of a set shows the whole set. The first piece a
 * step names is the base the others join ("Body, Welt": the welt joins the body).
 */
export function assemblyAt(steps: StepPieces[], index: number): Assembly | null {
  // Each joined set, by any of its members; members keep the order they were attached in
  const setOf = new Map<string, AssemblyMember[]>()
  const ensure = (id: string) => {
    if (!setOf.has(id)) setOf.set(id, [{ id }])
    return setOf.get(id)!
  }
  for (let k = 0; k < index; k++) {
    const ids = stepPieceIds(steps[k])
    ids.forEach(ensure)
    if (ids.length < 2) continue
    // The first piece named is what the others are attached to
    const [main, ...rest] = [...new Set(ids.map((id) => setOf.get(id)!))]
    for (const set of rest) {
      main.push(...attached(set, ids, steps[k].join))
      for (const m of set) setOf.set(m.id, main)
    }
  }
  const ids = stepPieceIds(steps[index] ?? {})
  if (ids.length === 0) return null
  const groups: AssemblyMember[][] = []
  for (const id of ids) {
    const set = setOf.get(id) ?? [{ id }]
    if (!groups.includes(set)) groups.push(set)
  }
  // The first piece named (with everything already sewn to it) is the base
  const base = groups[0]
  const join = steps[index].join
  const inBase = (id: string) => base.some((m) => m.id === id)
  let recentJoin = false
  for (let k = index - 1; k >= Math.max(0, index - 3); k--) {
    const before = stepPieceIds(steps[k])
    if (before.length >= 2 && before.some(inBase)) {
      recentJoin = true
      break
    }
    if (!before.length || !before.every(inBase) || !['pin', 'sew', 'attach', 'press'].includes(steps[k].action ?? '')) break
  }
  return { base, joining: groups.filter((g) => g !== base).map((g) => attached(g, ids, join)), join: join ?? 'side', recentJoin }
}

/** A group as it's attached by a step: to the step's first piece, by the piece of it the step names */
function attached(set: AssemblyMember[], ids: string[], join: JoinKind | undefined): AssemblyMember[] {
  const contact = ids.find((id) => set.some((m) => m.id === id)) ?? set[0].id
  return set.map((m, i) => (i === 0 ? { ...m, via: join ?? 'side', to: ids[0], contact, n: set.length } : m))
}
