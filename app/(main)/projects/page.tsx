'use client'

import Link from 'next/link'
import { IconCircleCheck, IconNeedleThread } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { PageSection } from '@/components/patterns/page-section'
import { StatusBadge } from '@/components/patterns/status-badge'
import { GarmentImage } from '@/components/garment/GarmentArt'
import { useMounted } from '@/hooks/use-mounted'
import { getGarmentGuide } from '@/lib/data'
import { listProjects, type ProjectSummary } from '@/lib/project-summary'
import { sizeLabel } from '@/lib/sizes'

function ProjectRow({ summary }: { summary: ProjectSummary }) {
  const { garment, project, totalSteps, finished, percent } = summary
  const done = Math.min(project.completedUntil, totalSteps)
  const nextStep = finished ? undefined : getGarmentGuide(garment.id)?.steps[project.completedUntil]
  return (
    <article className="grid grid-cols-[6.5rem_1fr] gap-4 border-b pb-6 sm:grid-cols-[8rem_1fr] sm:gap-6">
      <GarmentImage name={garment.name} className="aspect-[4/5] p-3" />
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-medium tracking-[0.12em] uppercase">{garment.name}</h3>
          <p className="text-sm text-muted-foreground tabular-nums">
            {sizeLabel(project.size)} · {done} of {totalSteps} steps
          </p>
          {nextStep && (
            <p className="text-sm">
              <span className="text-muted-foreground">Next:</span> {nextStep.title}
            </p>
          )}
        </div>
        {finished ? (
          <StatusBadge status="success" className="self-start">
            <IconCircleCheck data-icon="inline-start" />
            Finished
          </StatusBadge>
        ) : (
          <div className="flex items-center gap-3">
            <Progress value={percent} aria-label={`${garment.name} progress`} className="flex-1" />
            <span className="text-xs text-muted-foreground tabular-nums">{percent}%</span>
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-2">
          {finished ? (
            <Button variant="outline" render={<Link href={`/garment/${garment.id}`} />}>
              View garment
            </Button>
          ) : (
            <>
              <Button render={<Link href={`/garment/${garment.id}/guide`} />}>Continue</Button>
              <Button variant="ghost" render={<Link href={`/garment/${garment.id}`} />}>
                Details
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ProjectsPage() {
  // Projects are saved in this browser, so they're only known after mount
  const projects = useMounted() ? listProjects() : null

  const active = projects?.filter((p) => !p.finished) ?? []
  const done = projects?.filter((p) => p.finished) ?? []

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title="Projects" description="Everything you’re sewing, saved on this device." />

      {projects === null ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      ) : projects.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconNeedleThread />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>Pick a garment and choose your size. Your progress is saved here as you sew.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" render={<Link href="/home" />}>
              Browse garments
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {active.length > 0 && (
            <PageSection title="In progress">
              <div className="flex flex-col gap-6">
                {active.map((p) => (
                  <ProjectRow key={p.garment.id} summary={p} />
                ))}
              </div>
            </PageSection>
          )}
          {done.length > 0 && (
            <PageSection title="Finished">
              <div className="flex flex-col gap-6">
                {done.map((p) => (
                  <ProjectRow key={p.garment.id} summary={p} />
                ))}
              </div>
            </PageSection>
          )}
          <section className="flex flex-col items-start gap-3">
            <h2 className="text-[1.375rem] leading-tight">Ready for the next one?</h2>
            <p className="text-sm text-muted-foreground">Find a pattern from an independent creator.</p>
            <Button variant="outline" render={<Link href="/explore" />}>
              Explore patterns
            </Button>
          </section>
        </>
      )}
    </PageContainer>
  )
}
