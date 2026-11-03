'use client'

import { cn } from 'cn'

import { Panel } from '@/components/patterns/panel'
import { dayKey, stepsByDay, type StepDone } from '@/lib/activity'
import { getGuideOutline } from '@/lib/data'
import { minutesPerStep, type ProjectSummary } from '@/lib/project-summary'

/** "2 h 15 min", rounded to five minutes */
const durationText = (minutes: number) => {
  const total = Math.round(minutes / 5) * 5
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** Stages of the guide whose every step is done */
const stagesDone = ({ garment, project }: ProjectSummary) => {
  let end = 0
  let done = 0
  for (const size of getGuideOutline(garment.id)?.stages ?? []) {
    end += size
    if (project.completedUntil >= end) done++
  }
  return done
}

/**
 * How the sewing is going, kept plain: this week's letters, ringed on the days you sewed, then what it has added up to.
 * Sewing happens when there's time, so there's no streak to lose. Everything comes from steps marked done.
 */
export function SewingDashboard({ activity, projects }: { activity: StepDone[]; projects: ProjectSummary[] }) {
  const byDay = stepsByDay(activity)
  const today = new Date()
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7))
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    return {
      key: dayKey(day),
      name: day.toLocaleDateString('en-GB', { weekday: 'long' }),
      letter: day.toLocaleDateString('en-GB', { weekday: 'narrow' }),
      count: byDay.get(dayKey(day)) ?? 0,
      today: dayKey(day) === dayKey(today),
    }
  })
  const stepsThisWeek = week.reduce((n, d) => n + d.count, 0)

  const finished = projects.filter((p) => p.finished).length
  const stepsDone = projects.reduce((n, p) => n + Math.min(p.project.completedUntil, p.totalSteps), 0)
  const stages = projects.reduce((n, p) => n + stagesDone(p), 0)
  const minutes = projects.reduce((n, p) => n + Math.min(p.project.completedUntil, p.totalSteps) * minutesPerStep(p.garment.estimatedTime, p.totalSteps), 0)

  // A total of nothing only discourages, so "finished" waits for the first one
  const totals = [
    { label: 'Stages done', value: String(stages) },
    { label: 'Steps done', value: String(stepsDone) },
    { label: 'Time sewn', value: durationText(minutes) },
    ...(finished > 0 ? [{ label: 'Finished', value: String(finished) }] : []),
  ]

  return (
    <Panel label="This week" meta={stepsThisWeek > 0 ? `${stepsThisWeek} ${stepsThisWeek === 1 ? 'step' : 'steps'}` : undefined} bodyClassName="gap-4 px-4 pb-4">
      {/* The day's own letter is ringed when you sewed that day */}
      <ul className="flex justify-between">
        {week.map((d) => (
          <li key={d.key}>
            <span
              aria-hidden
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-xs',
                d.count > 0 ? 'text-foreground ring-1 ring-foreground/60' : 'text-muted-foreground',
                d.today && 'font-medium text-foreground',
              )}
            >
              {d.letter}
            </span>
            <span className="sr-only">{d.name}{d.today ? ', today' : ''}: {d.count} {d.count === 1 ? 'step' : 'steps'}</span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2">
        {totals.map((t) => (
          <div key={t.label} className="flex items-baseline justify-between gap-4 rounded-(--control-radius) border bg-card px-3 py-2.5">
            <dt className="text-sm text-muted-foreground">{t.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{t.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}
