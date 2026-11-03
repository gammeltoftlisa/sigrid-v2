'use client'

import Link from 'next/link'
import { IconChevronRight } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { GarmentCard } from '@/components/patterns/garment-card'
import { HomeDashboard } from '@/components/patterns/home-dashboard'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel, PanelRow } from '@/components/patterns/panel'
import { ProductGrid } from '@/components/patterns/product-grid'
import { SewingDashboard } from '@/components/patterns/sewing-dashboard'
import { useMounted } from '@/hooks/use-mounted'
import { loadActivity } from '@/lib/activity'
import { easiestPatterns } from '@/lib/data'
import { useBag } from '@/lib/fabric/bag'
import { listProjects } from '@/lib/project-summary'


/**
 * Someone with nothing on the table yet: the title says what to do, and the easiest patterns are right there to
 * start from, with a way to see them all. No empty box: an empty state shouldn't take more room than the way out.
 */
function FirstVisit() {
  return (
    <>
      <PageHeader title="Start sewing" description="Pick a pattern you like. Your progress is saved after every step." />
      <ProductGrid
        label="Good places to start"
        action={
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/explore" />}>
            All patterns
            <IconChevronRight data-icon="inline-end" />
          </Button>
        }
      >
        <div className="tiles">
          {easiestPatterns(3).map((g) => (
            <GarmentCard
              key={g.id}
              href={`/garment/${g.id}`}
              name={g.name}
              difficulty={g.difficulty}
              time={g.estimatedTime}
              price={g.price}
              photoSrc={g.photo}
              photos={g.photos}
            />
          ))}
        </div>
      </ProductGrid>
    </>
  )
}

/**
 * Home is what you're sewing now and how it's going. Finished projects leave Home: they stay on You, marked
 * Finished, and still count in This week. Finding something new is what Explore is for.
 */
export default function HomePage() {
  // Projects are saved in this browser, so they're only known after mount
  const mounted = useMounted()
  const bag = useBag()

  if (!mounted) {
    return (
      <PageContainer>
        <PageHeader title="Your sewing" />
      </PageContainer>
    )
  }

  const projects = listProjects()
  const activity = loadActivity()
  const active = projects.filter((p) => !p.finished)
  const hasSide = activity.length > 0 || bag.length > 0

  return (
    <PageContainer>
      {projects.length === 0 ? (
        <FirstVisit />
      ) : (
        <>
          <PageHeader title="Your sewing" />
          <div className="grid-12">
            <div className={cn('flex flex-col gap-3', hasSide && 'col-main')}>
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
            </div>
            {hasSide && (
              <div className="col-side flex flex-col gap-3">
                {/* Numbers with nothing in them only discourage, so they wait for the first finished step */}
                {activity.length > 0 && <SewingDashboard activity={activity} projects={projects} />}
                {bag.length > 0 && (
                  <Panel label="Your bag">
                    <PanelRow
                      href="/fabric"
                      title={`${bag.length} ${bag.length === 1 ? 'thing' : 'things'} to buy`}
                      detail="Waiting for you to check out at the shop"
                    />
                  </Panel>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  )
}
