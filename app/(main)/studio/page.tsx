'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconPlus, IconRuler2 } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { GarmentCard } from '@/components/patterns/garment-card'
import { ProductGrid } from '@/components/patterns/product-grid'
import { useAccountType } from '@/hooks/use-account-type'
import { useMounted } from '@/hooks/use-mounted'
import { createPattern, loadPatterns, plural } from '@/lib/studio/patterns'

/** The pattern maker's back office: every pattern they are writing or have finished. */
export default function StudioPage() {
  const router = useRouter()
  const mounted = useMounted()
  const account = useAccountType()
  const patterns = mounted ? loadPatterns() : []

  const startNew = () => router.push(`/studio/${createPattern().id}`)

  const newButton = (
    <Button size="lg" onClick={startNew}>
      <IconPlus data-icon="inline-start" />
      New pattern
    </Button>
  )

  if (account.ready && account.type !== 'maker') {
    return (
      <PageContainer>
        <PageHeader title="Pattern studio" breadcrumbs={[{ label: 'You', href: '/profile' }, { label: 'Pattern studio' }]} />
        <Empty className="bg-card rounded-(--radius)">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconRuler2 />
            </EmptyMedia>
            <EmptyTitle>The studio is for pattern makers</EmptyTitle>
            <EmptyDescription>To sell your own patterns, change your account type to Pattern maker in Settings.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" nativeButton={false} render={<Link href="/profile/settings" />}>Open Settings</Button>
          </EmptyContent>
        </Empty>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Pattern studio"
        description="Make a pattern the way sewers will see it, then publish it to Explore."
        breadcrumbs={[{ label: 'You', href: '/profile' }, { label: 'Pattern studio' }]}
        action={patterns.length > 0 ? newButton : undefined}
      />

      {mounted && patterns.length === 0 ? (
        <Empty className="bg-card rounded-(--radius)">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconRuler2 />
            </EmptyMedia>
            <EmptyTitle>No patterns yet</EmptyTitle>
            <EmptyDescription>Start one and write its sewing guide, step by step.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{newButton}</EmptyContent>
        </Empty>
      ) : (
        <ProductGrid label="Your patterns" meta={patterns.length || undefined}>
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
      )}
    </PageContainer>
  )
}
