import type { SewingStep2D } from './types'

export type JourneyKind = 'prepare' | 'cut' | 'sew' | 'finish'

export interface JourneySection {
  key: string
  title: string
  kind: JourneyKind
  /** Indices into the full steps array, in order */
  stepIndices: number[]
}

const kindOf = (groups: string[], steps: SewingStep2D[]): JourneyKind => {
  if (steps.some((s) => s.action === 'cut')) return 'cut'
  if (groups.every((g) => g === 'Prepare')) return 'prepare'
  if (groups.includes('Finish') || groups.every((g) => /hem/i.test(g))) return 'finish'
  return 'sew'
}

/**
 * Short journeys = quicker wins. Each run of steps sharing a `group` becomes
 * its own journey, except one-step groups, which join a neighbour so no
 * journey feels trivial (first into the next group, or into the previous
 * one if it's the last group).
 */
export function groupIntoJourneys(steps: SewingStep2D[]): JourneySection[] {
  type Run = { groups: string[]; stepIndices: number[] }
  const runs: Run[] = []
  steps.forEach((s, i) => {
    const last = runs[runs.length - 1]
    if (last && last.groups[last.groups.length - 1] === s.group) last.stepIndices.push(i)
    else runs.push({ groups: [s.group], stepIndices: [i] })
  })

  const merged: Run[] = []
  let carry: Run | null = null
  for (const run of runs) {
    const r: Run = carry
      ? { groups: [...carry.groups, ...run.groups], stepIndices: [...carry.stepIndices, ...run.stepIndices] }
      : run
    carry = null
    if (r.stepIndices.length < 2) carry = r
    else merged.push(r)
  }
  if (carry) {
    const prev = merged[merged.length - 1]
    if (prev) {
      prev.groups.push(...carry.groups)
      prev.stepIndices.push(...carry.stepIndices)
    } else {
      merged.push(carry)
    }
  }

  return merged.map((r) => ({
    key: r.groups.join('+'),
    title: r.groups.map((g, i) => (i === 0 ? g : g.toLowerCase())).join(' & '),
    kind: kindOf(r.groups, r.stepIndices.map((i) => steps[i])),
    stepIndices: r.stepIndices,
  }))
}
