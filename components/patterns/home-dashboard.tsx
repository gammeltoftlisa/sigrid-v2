import Link from 'next/link'
import { IconArrowRight, IconClock, IconShirt } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GarmentImage } from '@/components/garment/GarmentImage'
import { ProductGrid } from '@/components/patterns/product-grid'
import { TOOLS } from '@/components/sewing/tools'
import { getGuideOutline } from '@/lib/data'
import { getFabricNeed, metersFor } from '@/lib/fabric/needs'
import { minutesPerStep, type ProjectSummary } from '@/lib/project-summary'
import { sizeLabel } from '@/lib/sizes'

function timeLeft(minutes: number) {
  if (minutes < 45) return 'Under an hour left'
  const hours = Math.max(1, Math.round(minutes / 30) / 2)
  return `About ${hours} ${hours === 1 ? 'hour' : 'hours'} left`
}

/** One project: its photo and everything needed to pick it up, in one cell of the shared container. */
function ProjectRow({ project, primary }: { project: ProjectSummary; primary?: boolean }) {
  const { garment, totalSteps } = project
  const done = Math.min(project.project.completedUntil, totalSteps)
  const next = getGuideOutline(garment.id)?.steps[done]
  const tool = next?.tool ? TOOLS[next.tool] : null
  const need = getFabricNeed(garment.id)
  const size = project.project.size
  const href = `/garment/${garment.id}`

  return (
    <article className="flex flex-col gap-4 sm:flex-row">
      <Link href={href} aria-label={`Open ${garment.name}`} className="block shrink-0 rounded-(--image-radius) sm:w-52 lg:w-60">
        <GarmentImage
          name={garment.name}
          photoSrc={garment.photo}
          sizes="(min-width: 1024px) 240px, (min-width: 640px) 208px, 100vw"
          className="aspect-wide rounded-(--image-radius) sm:aspect-product"
          priority={primary}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:py-1">
        <div className="flex flex-col gap-1">
          <h2 className="title-md">{garment.name}</h2>
          <p className="text-sm text-muted-foreground">{sizeLabel(size)}</p>
        </div>

        {totalSteps > 0 && (
          <div className="flex items-center gap-2">
            <Progress value={project.percent} aria-label={`${garment.name} progress`} className="flex-1" />
            <span className="text-xs text-muted-foreground tabular-nums">{done} / {totalSteps}</span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <p className="eyebrow text-muted-foreground">Next step</p>
          <p className="title-md">{next?.title ?? 'Guide coming soon'}</p>
        </div>

        <ul className="flex flex-col gap-1.5 text-sm">
          {tool && (
            <li className="flex items-center gap-2">
              <tool.Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {tool.label}
            </li>
          )}
          {totalSteps > 0 && (
            <li className="flex items-center gap-2">
              <IconClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {timeLeft((totalSteps - done) * minutesPerStep(garment.estimatedTime, totalSteps))}
            </li>
          )}
          <li className="flex min-w-0 items-center gap-2">
            <IconShirt className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Link href={`/fabric?garment=${garment.id}`} className="truncate underline-offset-4 hover:underline">
              {metersFor(need, size)} m of {need.choices[0].name.toLowerCase()}
            </Link>
          </li>
        </ul>

        <Button size="lg" variant={primary ? 'default' : 'outline'} className="mt-auto w-full" nativeButton={false} render={<Link href={totalSteps > 0 ? `${href}/guide` : href} />}>
          {totalSteps > 0 ? 'Continue sewing' : 'View pattern'}
          <IconArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </article>
  )
}

/** A project waiting its turn: small, with just enough to pick it up. */
function CompactRow({ project }: { project: ProjectSummary }) {
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
export function HomeDashboard({ projects }: { projects: ProjectSummary[] }) {
  const [current, ...others] = projects
  return (
    <ProductGrid label="In progress" meta={projects.length}>
      <div className="project-rows">
        <ProjectRow project={current} primary />
      </div>
      {others.length > 0 && (
        <div className="project-rows project-rows-compact">
          {others.map((p) => (
            <CompactRow key={p.garment.id} project={p} />
          ))}
        </div>
      )}
    </ProductGrid>
  )
}
