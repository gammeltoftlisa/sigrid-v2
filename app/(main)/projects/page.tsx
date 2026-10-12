'use client'

import Link from 'next/link'
import { IconNeedleThread } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { ProjectGrid } from '@/components/patterns/project-grid'
import { useMounted } from '@/hooks/use-mounted'
import { listProjects } from '@/lib/project-summary'
import { loadActivity } from '@/lib/activity'
import { SewingDashboard } from '@/components/patterns/sewing-dashboard'

export default function ProjectsPage() {
  // Projects are saved in this browser, so they're only known after mount
  const mounted = useMounted()
  const projects = mounted ? listProjects() : null
  const activity = mounted ? loadActivity() : []

  const active = projects?.filter((p) => !p.finished) ?? []
  const done = projects?.filter((p) => p.finished) ?? []

  return (
    <PageContainer>
      <PageHeader breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Projects' }]} title="Projects" />

      {projects === null ? (
        <div className="tiles">
          <Skeleton className="h-64 rounded-(--radius)" />
          <Skeleton className="h-64 rounded-(--radius)" />
        </div>
      ) : projects.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconNeedleThread />
            </EmptyMedia>
            <EmptyTitle>Nothing on the sewing table yet</EmptyTitle>
            <EmptyDescription>Choose a garment to start. Your progress is saved after every step.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" nativeButton={false} render={<Link href="/home" />}>
              Choose a garment
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {active.length > 0 && <ProjectGrid label="In progress" projects={active} count />}
          <SewingDashboard activity={activity} projects={projects} />
          {done.length > 0 && <ProjectGrid label="Finished" projects={done} count />}
        </>
      )}
    </PageContainer>
  )
}
