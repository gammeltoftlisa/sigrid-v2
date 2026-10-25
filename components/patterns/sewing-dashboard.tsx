'use client'

import { IconFlame } from '@tabler/icons-react'
import { cn } from 'cn'

import { Inset } from '@/components/patterns/inset'
import { Panel } from '@/components/patterns/panel'
import { ACTION_LABELS } from '@/components/sewing/actions'
import { currentStreak, dayKey, longestStreak, stepsByDay, type StepDone } from '@/lib/activity'
import type { ProjectSummary } from '@/lib/project-summary'

/** Heatmap ramp: one hue (espresso), light → dark; empty days are plain white */
const RAMP = ['bg-data-1', 'bg-data-2', 'bg-data-3', 'bg-data-4']
const level = (n: number) => (n <= 0 ? -1 : n === 1 ? 0 : n <= 3 ? 1 : n <= 5 ? 2 : 3)
const WEEKS = 16

/** Average minutes per step for a garment, from its estimate ("3–4 hours") and step count */
function minutesPerStep(estimate: string, steps: number) {
  const nums = estimate.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [3]
  const hours = nums.reduce((a, b) => a + b, 0) / nums.length
  return steps ? (hours * 60) / steps : 0
}

function StatTile({ label, value, unit, hero }: { label: string; value: string | number; unit?: string; hero?: boolean }) {
  return (
    <Inset className="flex flex-col gap-1 p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1">
        {hero && <IconFlame className="size-5 self-center text-primary" aria-hidden />}
        <span className={cn('font-heading tabular-nums', hero ? 'text-5xl' : 'text-4xl')}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </span>
    </Inset>
  )
}

/**
 * The Projects dashboard: streaks, how much has been sewn, when, and which techniques.
 * Everything comes from steps the user marked done (see lib/activity).
 */
export function SewingDashboard({ activity, projects }: { activity: StepDone[]; projects: ProjectSummary[] }) {
  const byDay = stepsByDay(activity)
  const streak = currentStreak(byDay)
  const longest = longestStreak(byDay)
  const finished = projects.filter((p) => p.finished).length
  const stepsDone = projects.reduce((n, p) => n + Math.min(p.project.completedUntil, p.totalSteps), 0)
  const minutes = projects.reduce(
    (n, p) => n + Math.min(p.project.completedUntil, p.totalSteps) * minutesPerStep(p.garment.estimatedTime, p.totalSteps),
    0,
  )
  const hours = minutes / 60

  // This week vs last week
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(weekStart.getDate() - 7)
  const thisWeek = activity.filter((e) => new Date(e.at) >= weekStart).length
  const lastWeek = activity.filter((e) => new Date(e.at) >= lastWeekStart && new Date(e.at) < weekStart).length

  // Heatmap: WEEKS columns of Mon–Sun, ending this week
  const start = new Date(weekStart)
  start.setDate(start.getDate() - (WEEKS - 1) * 7)
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = new Date(start)
      day.setDate(start.getDate() + w * 7 + d)
      return { day, key: dayKey(day), count: byDay.get(dayKey(day)) ?? 0, future: day > today }
    }),
  )
  const activeDays = weeks.flat().filter((c) => c.count > 0).length

  // Techniques: steps done per action, most first
  const byAction = new Map<string, number>()
  for (const e of activity) byAction.set(e.action, (byAction.get(e.action) ?? 0) + 1)
  const techniques = [...byAction].sort((a, b) => b[1] - a[1])
  const maxTechnique = Math.max(1, ...techniques.map(([, n]) => n))

  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const weekDelta = thisWeek - lastWeek

  return (
    <div className="flex flex-col gap-6">
      <Panel label="Your sewing">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatTile label="Current streak" value={streak} unit={streak === 1 ? 'day' : 'days'} hero />
          <StatTile label="Longest streak" value={longest} unit={longest === 1 ? 'day' : 'days'} />
          <StatTile label="Steps done" value={stepsDone} />
          <StatTile label="Time sewn" value={hours < 10 ? hours.toFixed(1) : Math.round(hours)} unit="hours" />
        </div>
        <p className="px-1 pt-1 text-xs text-muted-foreground">
          {thisWeek === 0
            ? 'No steps yet this week. One step today starts a new streak.'
            : `${thisWeek} ${thisWeek === 1 ? 'step' : 'steps'} this week${
                lastWeek ? `, ${weekDelta >= 0 ? `${weekDelta} more` : `${-weekDelta} fewer`} than last week` : ''
              }. ${finished} ${finished === 1 ? 'garment' : 'garments'} finished so far.`}
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel label="When you sew" className="lg:col-span-2" meta={`${activeDays} days in ${WEEKS} weeks`}>
          <Inset className="overflow-x-auto p-4">
            <div className="flex justify-between gap-1 min-w-88" role="img" aria-label={`Sewing activity over the last ${WEEKS} weeks: ${activeDays} active days`}>
              <div className="mr-1 grid grid-rows-7 gap-1 text-2xs text-muted-foreground" aria-hidden>
                {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((d, i) => (
                  <span key={i} className="flex items-center">
                    {d}
                  </span>
                ))}
              </div>
              {weeks.map((week, w) => (
                <div key={w} className="grid max-w-6 flex-1 grid-rows-7 gap-1">
                  {week.map((c) => (
                    <span
                      key={c.key}
                      className={cn('group/cell relative aspect-square w-full rounded-xs', c.future ? 'bg-transparent' : c.count ? RAMP[level(c.count)] : 'bg-background')}
                    >
                      {!c.future && (
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-2xs text-background group-hover/cell:block">
                          {fmt(c.day)} · {c.count} {c.count === 1 ? 'step' : 'steps'}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 text-2xs text-muted-foreground" aria-hidden>
              Less
              <span className="size-3 rounded-xs bg-background" />
              {RAMP.map((c) => (
                <span key={c} className={cn('size-3 rounded-xs', c)} />
              ))}
              More
            </div>
            {/* Screen readers and anyone who prefers text: the same data as a list */}
            <ul className="sr-only">
              {weeks.flat().filter((c) => c.count > 0).map((c) => (
                <li key={c.key}>
                  {fmt(c.day)}: {c.count} {c.count === 1 ? 'step' : 'steps'}
                </li>
              ))}
            </ul>
          </Inset>
        </Panel>

        <Panel label="Techniques you’ve practised">
          <Inset className="flex flex-col gap-3 p-4">
            {techniques.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cutting, pinning and sewing will show up here as you go.</p>
            ) : (
              techniques.map(([action, n]) => (
                <div key={action} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-sm">{ACTION_LABELS[action] ?? action}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${(n / maxTechnique) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs text-muted-foreground tabular-nums">{n}</span>
                </div>
              ))
            )}
          </Inset>
        </Panel>
      </div>
    </div>
  )
}
