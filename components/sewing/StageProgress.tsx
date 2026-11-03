'use client'

import { cn } from 'cn'

import type { JourneySection } from '@/lib/journeys'

/**
 * How far the whole make has come, as one line cut into its stages: each stage's piece is as long as its steps,
 * filled as far as they're done, and the one you're in is drawn a little bolder. It shows progress only, never
 * which step you happen to be looking at.
 */
export function StageProgress({ journeys, completedUntil, total, className }: { journeys: JourneySection[]; completedUntil: number; total: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label="Progress through the guide"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(completedUntil, total)}
      aria-valuetext={`${Math.min(completedUntil, total)} of ${total} steps done`}
      className={cn('flex w-full gap-1', className)}
    >
      {journeys.map((j) => {
        const done = j.stepIndices.filter((i) => i < completedUntil).length
        const current = done < j.stepIndices.length && j.stepIndices[0] <= completedUntil
        return (
          <span
            key={j.key}
            title={`${j.title}: ${done} of ${j.stepIndices.length}`}
            className={cn('stage-segment', current && 'stage-segment-current')}
            style={{ flexGrow: j.stepIndices.length }}
          >
            <span className="stage-segment-fill" style={{ width: `${(done / j.stepIndices.length) * 100}%` }} />
          </span>
        )
      })}
    </div>
  )
}
