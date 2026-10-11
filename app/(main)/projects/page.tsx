'use client'

import Link from 'next/link'
import { IconNeedleThread } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { PageSection } from '@/components/patterns/page-section'
import { ProjectPanel } from '@/components/patterns/project-panel'
import { useMounted } from '@/hooks/use-mounted'
import { listProjects, projectPanelData } from '@/lib/project-summary'

export default function ProjectsPage() {
  // Projects are saved in this browser, so they're only known after mount
  const projects = useMounted() ? listProjects() : null

  const active = projects?.filter((p) => !p.finished) ?? []
  const done = projects?.filter((p) => p.finished) ?? []

  return (
    <PageContainer>
      <PageHeader breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Projects' }]} title="Projects" description="What you’re making and what you’ve made. Your progress is saved on this device after every step." />

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
            <EmptyTitle>Nothing on the sewing table yet</EmptyTitle>
            <EmptyDescription>Choose a garment and your size. We save your progress after every step, so you can stop whenever you like.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" render={<Link href="/home" />}>
              Choose a garment
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {active.length > 0 && (
            <PageSection title="In progress">
              <div className="tile-grid grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {active.map((p) => (
                  <ProjectPanel key={p.garment.id} {...projectPanelData(p.garment, p.project.size, p.project.completedUntil)} label="In progress" />
                ))}
              </div>
            </PageSection>
          )}
          {done.length > 0 && (
            <PageSection title="Finished">
              <div className="tile-grid grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {done.map((p) => (
                  <ProjectPanel key={p.garment.id} {...projectPanelData(p.garment, p.project.size, p.project.completedUntil)} label="Finished" />
                ))}
              </div>
            </PageSection>
          )}
          <section className="flex flex-col items-start gap-3">
            <h2 className="text-[1.375rem] leading-tight">Ready for the next one?</h2>
            <p className="text-sm text-muted-foreground">Find your next pattern from an independent maker.</p>
            <Button variant="outline" render={<Link href="/explore" />}>
              Explore patterns
            </Button>
          </section>
        </>
      )}
    </PageContainer>
  )
}
