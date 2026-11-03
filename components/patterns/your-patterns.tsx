'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconBooks, IconChevronRight, IconPlus, IconRuler2 } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { GarmentCard } from '@/components/patterns/garment-card'
import { ProductGrid } from '@/components/patterns/product-grid'
import { StatusMessage } from '@/components/patterns/status-message'
import { useMounted } from '@/hooks/use-mounted'
import { usePurchases } from '@/hooks/use-purchases'
import { catalogGarments, getGuideOutline } from '@/lib/data'
import { paymentsEnabled } from '@/lib/payments'
import { listProjects } from '@/lib/project-summary'
import { createPattern, loadPatterns, plural } from '@/lib/studio/patterns'
import type { Garment } from '@/lib/types'

/**
 * Every pattern you own, on You. A pattern is bought for good, so this is its home whether you've started it,
 * finished it or never opened it. Sewing progress can be deleted; owning the pattern can't.
 */
export function OwnedPatterns({ primary = true }: { primary?: boolean }) {
  const mounted = useMounted()
  const { garmentIds, loading, failed, refresh } = usePurchases()
  const projects = mounted ? listProjects() : []
  // While everything is free there's nothing to own yet: the patterns you've started are yours
  const owned: Garment[] = paymentsEnabled
    ? garmentIds.flatMap((id) => catalogGarments.filter((g) => g.id === id))
    : projects.map((p) => p.garment)

  if (failed) {
    return (
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
    )
  }

  if (loading || !mounted) {
    return (
      <ProductGrid label="Your patterns" aria-busy="true">
        <div className="tiles">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-product" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </ProductGrid>
    )
  }

  if (owned.length === 0) {
    return (
      <ProductGrid label="Your patterns">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconBooks />
            </EmptyMedia>
            <EmptyTitle>No patterns yet</EmptyTitle>
            <EmptyDescription>Patterns you buy stay here for good.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {/* Secondary when the page already has a main action (a maker's New pattern) */}
            <Button variant={primary ? 'default' : 'outline'} nativeButton={false} render={<Link href="/explore" />}>
              Explore patterns
            </Button>
          </EmptyContent>
        </Empty>
      </ProductGrid>
    )
  }

  return (
    <ProductGrid label="Your patterns" meta={owned.length}>
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
              photos={g.photos}
              tag={project ? (project.finished ? 'Finished' : `${project.percent}% sewn`) : steps ? 'Not started' : undefined}
            />
          )
        })}
      </div>
    </ProductGrid>
  )
}

/**
 * A pattern maker's own patterns, on You: published ones and drafts, each opening in the studio.
 * The studio itself, with editing and deleting, is one tap away.
 */
export function MadePatterns() {
  const mounted = useMounted()
  const router = useRouter()
  const patterns = mounted ? loadPatterns() : []
  const published = patterns.filter((p) => p.publishedAt).length

  const startNew = () => router.push(`/studio/${createPattern().id}`)
  const studioLink = (
    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/studio" />}>
      Pattern studio
      <IconChevronRight data-icon="inline-end" />
    </Button>
  )

  if (mounted && patterns.length === 0) {
    return (
      <ProductGrid label="Made by you" action={studioLink}>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconRuler2 />
            </EmptyMedia>
            <EmptyTitle>Make your first pattern</EmptyTitle>
            <EmptyDescription>Write its sewing guide step by step, then publish it to Explore.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={startNew}>
              <IconPlus data-icon="inline-start" />
              New pattern
            </Button>
          </EmptyContent>
        </Empty>
      </ProductGrid>
    )
  }

  return (
    <ProductGrid label="Made by you" meta={published > 0 ? `${published} published` : undefined} action={studioLink}>
      <div className="tiles">
        {patterns.map((p) => (
          <GarmentCard
            key={p.id}
            href={`/studio/${p.id}`}
            name={p.name}
            difficulty={p.difficulty}
            photoSrc={p.photo ?? null}
            photos={p.photos}
            tag={p.publishedAt ? 'Published' : 'Draft'}
            byline={`${plural(p.steps.length, 'step')} · ${plural(p.pieces.length, 'piece')}`}
            price={p.price ?? undefined}
          />
        ))}
      </div>
    </ProductGrid>
  )
}
