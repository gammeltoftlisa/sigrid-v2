'use client'

import { cn } from 'cn'

import { Panel } from '@/components/patterns/panel'
import { dayKey, stepsByDay, type StepDone } from '@/lib/activity'
import { minutesPerStep, type ProjectSummary } from '@/lib/project-summary'

/** One hue, light to dark; a day with nothing sewn stays empty */
const RAMP = ['bg-data-1', 'bg-data-2', 'bg-data-3', 'bg-data-4']
const level = (n: number) => (n === 1 ? 0 : n <= 3 ? 1 : n <= 5 ? 2 : 3)

function hoursText(minutes: number) {
  if (minutes < 45) return 'Under an hour'
  const hours = Math.round(minutes / 30) / 2
  return `About ${hours} ${hours === 1 ? 'hour' : 'hours'}`
}

/**
 * How the sewing is going: this week day by day, and what it has added up to.
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
  const minutes = projects.reduce((n, p) => n + Math.min(p.project.completedUntil, p.totalSteps) * minutesPerStep(p.garment.estimatedTime, p.totalSteps), 0)

  const totals = [
    { label: 'Garments finished', value: String(finished) },
    { label: 'Steps done', value: String(stepsDone) },
    { label: 'Time sewn', value: hoursText(minutes) },
  ]

  return (
    <Panel label="This week" meta={stepsThisWeek > 0 ? `${stepsThisWeek} ${stepsThisWeek === 1 ? 'step' : 'steps'}` : undefined} bodyClassName="gap-4 px-4 pb-4">
      <ul className="grid grid-cols-7 gap-1">
        {week.map((d) => (
          <li key={d.key} className="flex flex-col items-center gap-1">
            <span aria-hidden className={cn('text-2xs', d.today ? 'font-medium text-foreground' : 'text-muted-foreground')}>{d.letter}</span>
            <span
              aria-hidden
              className={cn(
                'aspect-square w-full rounded-xs border',
                d.count > 0 ? cn(RAMP[level(d.count)], 'border-transparent') : 'bg-transparent',
                d.today && 'border-foreground',
              )}
            />
            <span className="sr-only">{d.name}{d.today ? ', today' : ''}: {d.count} {d.count === 1 ? 'step' : 'steps'}</span>
          </li>
        ))}
      </ul>
      {stepsThisWeek === 0 && <p className="text-sm text-muted-foreground">Nothing marked done yet this week.</p>}
      <div className="flex flex-col gap-2 border-t pt-4">
        <p className="eyebrow text-muted-foreground">So far</p>
        <dl className="flex flex-col gap-2">
          {totals.map((t) => (
            <div key={t.label} className="flex items-baseline justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{t.label}</dt>
              <dd className="text-right tabular-nums">{t.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  )
}
