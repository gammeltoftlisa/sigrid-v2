import Link from 'next/link'
import { IconArrowRight, IconClock, IconShirt } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GarmentImage } from '@/components/garment/GarmentImage'
import { ProductGrid } from '@/components/patterns/product-grid'
import { TOOLS } from '@/components/sewing/tools'
import { dayKey, type StepDone } from '@/lib/activity'
import { getGuideOutline } from '@/lib/data'
import { getFabricNeed, metersFor } from '@/lib/fabric/needs'
import { minutesPerStep, type ProjectSummary } from '@/lib/project-summary'
import { sizeLabel } from '@/lib/sizes'

function timeLeft(minutes: number) {
  if (minutes < 45) return 'Under an hour left'
  const hours = Math.max(1, Math.round(minutes / 30) / 2)
  return `About ${hours} ${hours === 1 ? 'hour' : 'hours'} left`
}

/** When this project last got a step marked done, in words. Null if it never has. */
function lastSewn(garmentId: string, activity: StepDone[], today = new Date()) {
  const latest = activity.filter((e) => e.garmentId === garmentId).reduce<string | null>((a, e) => (a && a > e.at ? a : e.at), null)
  if (!latest) return null
  const day = new Date(latest)
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((midnight(today) - midnight(day)) / 86400000)
  if (dayKey(day) === dayKey(today)) return 'Last sewn today'
  if (days === 1) return 'Last sewn yesterday'
  if (days < 14) return `Last sewn ${days} days ago`
  return `Last sewn ${day.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`
}

/** The project to pick up: the step waiting, what it takes, and one way back in. */
function CurrentProject({ project, activity }: { project: ProjectSummary; activity: StepDone[] }) {
  const { garment, totalSteps } = project
  const done = Math.min(project.project.completedUntil, totalSteps)
  const steps = getGuideOutline(garment.id)?.steps ?? []
  const next = steps[done]
  const after = steps.slice(done + 1, done + 3)
  const tool = next?.tool ? TOOLS[next.tool] : null
  const size = project.project.size
  const need = getFabricNeed(garment.id)
  const href = `/garment/${garment.id}`
  const sewn = lastSewn(garment.id, activity)

  return (
    <article className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <Link href={href} aria-label={`Open ${garment.name}`} className="block shrink-0 rounded-(--image-radius) sm:w-52 lg:w-64">
        <GarmentImage
          name={garment.name}
          photoSrc={garment.photo}
          sizes="(min-width: 1024px) 256px, (min-width: 640px) 208px, 100vw"
          className="aspect-wide rounded-(--image-radius) sm:aspect-product"
          priority
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-6 sm:py-1">
        <div className="flex flex-col gap-1">
          <h2 className="title-md">{garment.name}</h2>
          <p className="text-sm text-muted-foreground">{[sizeLabel(size), sewn].filter(Boolean).join(' · ')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="eyebrow text-muted-foreground">{done === 0 ? 'First step' : 'Next step'}</p>
          <p className="title-lg">{next?.title ?? 'Guide coming soon'}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {tool && (
              <li className="flex items-center gap-2">
                <tool.Icon className="size-4 shrink-0" aria-hidden />
                {tool.label}
              </li>
            )}
            {totalSteps > 0 && (
              <li className="flex items-center gap-2">
                <IconClock className="size-4 shrink-0" aria-hidden />
                {timeLeft((totalSteps - done) * minutesPerStep(garment.estimatedTime, totalSteps))}
              </li>
            )}
            {/* Fabric only matters before the first cut. After that it's on the table already. */}
            {done === 0 && (
              <li className="flex min-w-0 items-center gap-2">
                <IconShirt className="size-4 shrink-0" aria-hidden />
                <Link href={`/fabric?garment=${garment.id}`} className="underline underline-offset-4">
                  {metersFor(need, size)} m of {need.choices[0].name.toLowerCase()}
                </Link>
              </li>
            )}
          </ul>
        </div>

        {after.length > 0 && (
          <div className="flex flex-col gap-1 text-sm">
            <p className="eyebrow text-muted-foreground">After that</p>
            {after.map((s) => (
              <p key={s.title} className="truncate">{s.title}</p>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-4">
          {totalSteps > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={project.percent} aria-label={`${garment.name} progress`} className="flex-1" />
              <span className="text-xs text-muted-foreground tabular-nums">{done} / {totalSteps}</span>
            </div>
          )}
          <Button size="lg" className="w-full sm:w-fit" nativeButton={false} render={<Link href={totalSteps > 0 ? `${href}/guide` : href} />}>
            {totalSteps > 0 ? (done === 0 ? 'Start sewing' : 'Continue sewing') : 'View pattern'}
            <IconArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </article>
  )
}

/** A project waiting its turn: small, with just enough to pick it up. */
function WaitingProject({ project }: { project: ProjectSummary }) {
  const { garment, totalSteps } = project
  const done = Math.min(project.project.completedUntil, totalSteps)
  const next = getGuideOutline(garment.id)?.steps[done]
  return (
    <article className="flex items-center gap-3">
      <Link href={`/garment/${garment.id}`} aria-label={`Open ${garment.name}`} className="block w-20 shrink-0 rounded-(--image-radius)">
        <GarmentImage name={garment.name} photoSrc={garment.photo} sizes="80px" className="aspect-product rounded-(--image-radius)" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="title-sm truncate">{garment.name}</h3>
        <p className="truncate text-xs text-muted-foreground">{next ? `Next: ${next.title}` : 'Guide coming soon'}</p>
        {totalSteps > 0 && (
          <div className="flex items-center gap-2">
            <Progress value={project.percent} aria-label={`${garment.name} progress`} className="flex-1" />
            <span className="text-2xs text-muted-foreground tabular-nums">{done} / {totalSteps}</span>
          </div>
        )}
        <Button size="sm" variant="outline" className="w-fit" nativeButton={false} render={<Link href={`/garment/${garment.id}${totalSteps > 0 ? '/guide' : ''}`} />}>
          {totalSteps > 0 ? 'Continue' : 'View pattern'}
        </Button>
      </div>
    </article>
  )
}

/** Home for someone who is sewing: the most recent project up front, the others smaller, in one container. */
export function HomeDashboard({ projects, activity }: { projects: ProjectSummary[]; activity: StepDone[] }) {
  const [current, ...others] = projects
  return (
    <ProductGrid label="In progress" meta={projects.length}>
      <div className="project-rows">
        <CurrentProject project={current} activity={activity} />
      </div>
      {others.length > 0 && (
        <div className="project-rows project-rows-compact">
          {others.map((p) => (
            <WaitingProject key={p.garment.id} project={p} />
          ))}
        </div>
      )}
    </ProductGrid>
  )
}
