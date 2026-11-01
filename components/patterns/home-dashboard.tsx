import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GarmentImage } from '@/components/garment/GarmentImage'
import { ProductGrid } from '@/components/patterns/product-grid'
import { ProjectGrid } from '@/components/patterns/project-grid'
import { getGuideOutline } from '@/lib/data'
import type { ProjectSummary } from '@/lib/project-summary'

/** The one project on the table: what it is, the step waiting, and one way back in. */
function CurrentProject({ project }: { project: ProjectSummary }) {
  const { garment, totalSteps } = project
  const done = Math.min(project.project.completedUntil, totalSteps)
  const next = getGuideOutline(garment.id)?.steps[done]
  const href = `/garment/${garment.id}`

  return (
    <article className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <Link href={href} aria-label={`Open ${garment.name}`} className="block shrink-0 rounded-(--image-radius) sm:w-52 lg:w-64">
        <GarmentImage
          name={garment.name}
          photoSrc={garment.photo}
          sizes="(min-width: 1024px) 256px, (min-width: 640px) 208px, 100vw"
          className="aspect-product rounded-(--image-radius)"
          priority
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-6 sm:py-1">
        <h2 className="title-md">{garment.name}</h2>

        <div className="flex flex-col gap-2">
          <p className="eyebrow text-muted-foreground">{done === 0 ? 'First step' : 'Next step'}</p>
          <p className="title-lg">{next?.title ?? 'Guide coming soon'}</p>
        </div>

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

/** Home for someone who is sewing: one project gets the whole container, several share it in equal cards. */
export function HomeDashboard({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length > 1) return <ProjectGrid label="In progress" projects={projects} count />
  return (
    <ProductGrid label="In progress">
      <div className="p-3">
        <CurrentProject project={projects[0]} />
      </div>
    </ProductGrid>
  )
}
