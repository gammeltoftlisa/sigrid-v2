'use client'

import Link from 'next/link'
import { IconNeedleThread } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { GarmentCard } from '@/components/patterns/garment-card'
import { HomeDashboard } from '@/components/patterns/home-dashboard'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { ProductGrid } from '@/components/patterns/product-grid'
import { ProjectGrid } from '@/components/patterns/project-grid'
import { SewingDashboard } from '@/components/patterns/sewing-dashboard'
import { useMounted } from '@/hooks/use-mounted'
import { loadActivity } from '@/lib/activity'
import { easiestPatterns } from '@/lib/data'
import { listProjects } from '@/lib/project-summary'

const HEADER = 'pt-8 md:pt-12'

/** Someone with nothing on the table yet: one way forward, and a few easy patterns to make it concrete. */
function FirstVisit() {
  return (
    <>
      <PageHeader title="Start sewing" className={HEADER} />
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconNeedleThread />
          </EmptyMedia>
          <EmptyTitle>Nothing on your table yet</EmptyTitle>
          <EmptyDescription>Pick a pattern you like. Your progress is saved after every step.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="lg" nativeButton={false} render={<Link href="/explore" />}>
            Find your first pattern
          </Button>
        </EmptyContent>
      </Empty>
      <ProductGrid label="Good places to start">
        <div className="tiles">
          {easiestPatterns(3).map((g) => (
            <GarmentCard
              key={g.id}
              href={`/garment/${g.id}`}
              name={g.name}
              difficulty={g.difficulty}
              time={g.estimatedTime}
              price={g.price}
            />
          ))}
        </div>
      </ProductGrid>
    </>
  )
}

/** Home is what you're sewing and how it's going. Finding something new is what Explore is for. */
export default function HomePage() {
  // Projects are saved in this browser, so they're only known after mount
  const mounted = useMounted()

  if (!mounted) {
    return (
      <PageContainer>
        <PageHeader title="Your sewing" className={HEADER} />
      </PageContainer>
    )
  }

  const projects = listProjects()
  const activity = loadActivity()
  const active = projects.filter((p) => !p.finished)
  const finished = projects.filter((p) => p.finished)

  return (
    <PageContainer>
      {projects.length === 0 ? (
        <FirstVisit />
      ) : (
        <>
          <PageHeader title="Your sewing" className={HEADER} />
          {active.length > 0 ? (
            <HomeDashboard projects={active} />
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>Everything’s finished</EmptyTitle>
                <EmptyDescription>Well done. Ready for the next one?</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="lg" nativeButton={false} render={<Link href="/explore" />}>
                  Find your next pattern
                </Button>
              </EmptyContent>
            </Empty>
          )}
          {/* Charts with nothing in them only discourage, so they wait for the first finished step */}
          {activity.length > 0 && <SewingDashboard activity={activity} projects={projects} />}
          {finished.length > 0 && <ProjectGrid label="Finished" projects={finished} count />}
        </>
      )}
    </PageContainer>
  )
}
