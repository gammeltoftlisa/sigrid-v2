'use client'

import { use, useState } from 'react'
import { IconCertificate, IconCheck, IconPlus } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageSection } from '@/components/patterns/page-section'
import { PageContainer, TopBar } from '@/components/patterns/page-header'
import { Panel } from '@/components/patterns/panel'
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
      <TopBar back="/explore" breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Explore', href: '/explore' }, { label: creator.handle }]} />

      <div className="grid gap-6 pt-2 md:pt-4 lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
        <Panel
          label={creator.isCertified ? 'Certified creator' : 'Pattern maker'}
          className="lg:sticky lg:top-20 lg:self-start"
          footer={
            <Button
              variant={following ? 'outline' : 'default'}
              aria-pressed={following}
              onClick={() => setFollowing((f) => !f)}
              className="w-full"
            >
              {following ? <IconCheck data-icon="inline-start" /> : <IconPlus data-icon="inline-start" />}
              {following ? 'Following' : 'Follow'}
            </Button>
          }
        >
          <div className="flex items-center gap-4 px-1 py-2">
            <CreatorAvatar creator={creator} className="size-16 text-xl" />
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="truncate !text-2xl !leading-tight font-semibold tracking-tight">{creator.handle}</h1>
              {creator.isCertified && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <IconCertificate className="size-3.5" aria-hidden />
                  Checked by Sigrid
                </span>
              )}
            </div>
          </div>
          <p className="px-1 pb-2 text-sm text-muted-foreground">{creator.bio}</p>
          <dl className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse rounded-(--radius) border bg-background px-2.5 py-2">
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="text-base font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <PageSection title="Patterns">
          {patterns.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No patterns published yet.</p>
          ) : (
            <div className="tile-grid grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 2xl:grid-cols-4">
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
      </div>
    </PageContainer>
  )
}
