'use client'

import { use } from 'react'

import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageSection } from '@/components/patterns/page-section'
import { ProductGrid } from '@/components/patterns/product-grid'
import { ProfileHeader } from '@/components/patterns/profile-header'
import { PageContainer, TopBar } from '@/components/patterns/page-header'
import { getCreatorById, getPatternsByCreator } from '@/lib/data'

export default function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const creator = getCreatorById(id)
  const patterns = getPatternsByCreator(id)
  // Only real, verifiable numbers. Follower counts and "made by" counts come back when they're measured.
  const stats = [{ label: patterns.length === 1 ? 'pattern' : 'patterns', value: patterns.length.toString() }]

  return (
    <PageContainer>
      <TopBar breadcrumbs={[{ label: 'Explore', href: '/explore?view=makers' }, { label: creator.handle }]} />

      <ProfileHeader
        avatar={<CreatorAvatar creator={creator} size="xl" />}
        name={creator.name}
        label="Example profile"
        subtitle={creator.handle}
        bio={creator.bio}
        stats={stats}
      />

      <PageSection title="Patterns">
        {patterns.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">No patterns published yet.</p>
        ) : (
          <ProductGrid>
          <div className="tiles">
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
          </ProductGrid>
        )}
      </PageSection>
    </PageContainer>
  )
}
