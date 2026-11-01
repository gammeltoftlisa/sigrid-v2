'use client'

import Link from 'next/link'
import { IconBooks } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { ProductGrid } from '@/components/patterns/product-grid'
import { StatusMessage } from '@/components/patterns/status-message'
import { useMounted } from '@/hooks/use-mounted'
import { usePurchases } from '@/hooks/use-purchases'
import { catalogGarments, getGuideOutline } from '@/lib/data'
import { paymentsEnabled } from '@/lib/payments'
import { listProjects } from '@/lib/project-summary'
import type { Garment } from '@/lib/types'

/**
 * Every pattern you own. A pattern is bought for good, so this is its home whether you've started it,
 * finished it or never opened it. Sewing progress can be deleted; owning the pattern can't.
 */
export default function MyPatternsPage() {
  const mounted = useMounted()
  const { garmentIds, loading, failed, refresh } = usePurchases()
  const projects = mounted ? listProjects() : []
  // While everything is free there's nothing to own yet: the patterns you've started are yours
  const owned: Garment[] = paymentsEnabled
    ? garmentIds.flatMap((id) => catalogGarments.filter((g) => g.id === id))
    : projects.map((p) => p.garment)

  return (
    <PageContainer>
      <PageHeader title="My patterns" description="Everything you’ve bought stays here for good, so you can sew it again whenever you like." />

      {failed && (
        <StatusMessage
          status="error"
          title="We couldn’t load your patterns"
          action={
            <Button variant="outline" size="sm" onClick={() => refresh().catch(() => {})}>
              Try again
            </Button>
          }
        >
          They’re still yours. Check your connection and try again.
        </StatusMessage>
      )}

      {(loading || !mounted) && !failed && (
        <ProductGrid aria-busy="true" aria-label="Loading your patterns">
          <div className="tiles">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-product rounded-none" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        </ProductGrid>
      )}

      {!loading && mounted && !failed && owned.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconBooks />
            </EmptyMedia>
            <EmptyTitle>No patterns yet</EmptyTitle>
            <EmptyDescription>Patterns you buy stay here for good.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/explore" />}>
              Explore patterns
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {!loading && mounted && owned.length > 0 && (
        <ProductGrid label="Yours" meta={owned.length}>
          <div className="tiles">
            {owned.map((g) => {
              const project = projects.find((p) => p.garment.id === g.id)
              const steps = getGuideOutline(g.id)?.steps.length ?? 0
              return (
                <GarmentCard
                  key={g.id}
                  href={`/garment/${g.id}`}
                  name={g.name}
                  difficulty={g.difficulty}
                  time={g.estimatedTime}
                  photoSrc={g.photo}
                  tag={project ? (project.finished ? 'Finished' : `${project.percent}% sewn`) : steps ? 'Not started' : undefined}
                />
              )
            })}
          </div>
        </ProductGrid>
      )}
    </PageContainer>
  )
}
