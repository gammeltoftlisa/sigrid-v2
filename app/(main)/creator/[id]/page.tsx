'use client'

import { use, useState } from 'react'
import { IconCheck, IconPlus } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageSection } from '@/components/patterns/page-section'
import { ProfileHeader } from '@/components/patterns/profile-header'
import { PageContainer, TopBar } from '@/components/patterns/page-header'
import { getCreatorById, getPatternsByCreator } from '@/lib/data'

export default function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const creator = getCreatorById(id)
  const patterns = getPatternsByCreator(id)
  const [following, setFollowing] = useState(false)
  // Only real, verifiable numbers. Follower counts and "made by" counts come back when they're measured.
  const stats = [{ label: patterns.length === 1 ? 'pattern' : 'patterns', value: patterns.length.toString() }]

  return (
    <PageContainer>
      <TopBar breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Explore', href: '/explore' }, { label: creator.handle }]} />

      <ProfileHeader
        avatar={<CreatorAvatar creator={creator} size="xl" />}
        name={creator.name}
        label="Example profile"
        subtitle={creator.handle}
        bio={creator.bio}
        stats={stats}
        action={
          <Button size="lg" variant={following ? 'outline' : 'default'} aria-pressed={following} onClick={() => setFollowing((f) => !f)}>
            {following ? <IconCheck data-icon="inline-start" /> : <IconPlus data-icon="inline-start" />}
            {following ? 'Following' : 'Follow'}
          </Button>
        }
      />

      <PageSection title="Patterns">
        {patterns.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">No patterns published yet.</p>
        ) : (
          <div className="tile-grid tiles">
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
