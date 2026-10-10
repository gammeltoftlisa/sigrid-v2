'use client'

import { use, useState } from 'react'
import { IconCertificate, IconCheck, IconPlus } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageSection } from '@/components/patterns/page-section'
import { BackButton, PageContainer } from '@/components/patterns/page-header'
import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'
import { getCreatorById, getPatternsByCreator } from '@/lib/data'

export default function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const creator = getCreatorById(id)
  const patterns = getPatternsByCreator(id)
  const [following, setFollowing] = useState(false)
  const makes = patterns.reduce((sum, p) => sum + p.timesMade, 0)

  const stats = [
    { label: 'followers', value: creator.followerCount },
    { label: 'patterns', value: patterns.length.toString() },
    { label: 'makes', value: makes.toLocaleString('en-US') },
  ]

  return (
    <PageContainer>
      <div className="flex min-w-0 items-center gap-2 pt-6 md:pt-10">
        <BackButton />
        <PageBreadcrumbs items={[{ label: 'Home', href: '/home' }, { label: 'Explore', href: '/explore' }, { label: creator.handle }]} />
      </div>

      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <CreatorAvatar creator={creator} className="size-20 text-2xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-semibold tracking-tight">{creator.handle}</h1>
            {creator.isCertified && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <IconCertificate className="size-4" aria-hidden />
                Certified creator
              </span>
            )}
          </div>
          <p className="max-w-prose text-sm text-muted-foreground">{creator.bio}</p>
          <dl className="mt-1 flex items-center justify-center gap-4 sm:justify-start">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-4">
                {i > 0 && <Separator orientation="vertical" className="h-8" />}
                <div className="flex flex-col">
                  <dd className="text-base font-semibold tabular-nums">{s.value}</dd>
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
        <Button
          size="lg"
          variant={following ? 'outline' : 'default'}
          aria-pressed={following}
          onClick={() => setFollowing((f) => !f)}
          className="w-full sm:w-auto"
        >
          {following ? <IconCheck data-icon="inline-start" /> : <IconPlus data-icon="inline-start" />}
          {following ? 'Following' : 'Follow'}
        </Button>
      </section>

      <PageSection title="Patterns">
        {patterns.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">No patterns published yet.</p>
        ) : (
          <div className="tile-grid grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {patterns.map((p) => (
              <GarmentCard
                key={p.id}
                href={`/garment/${p.garmentId}`}
                name={p.name}
                difficulty={p.difficulty}
                byline={`${p.fit} fit`}
                price={p.price}
              />
            ))}
          </div>
        )}
      </PageSection>
    </PageContainer>
  )
}
