'use client'

import { use } from 'react'

import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentCard } from '@/components/patterns/garment-card'
import { ProductGrid } from '@/components/patterns/product-grid'
import { ProfileHeader } from '@/components/patterns/profile-header'
import { PageContainer, TopBar } from '@/components/patterns/page-header'
import { NotFoundMessage } from '@/components/patterns/not-found-message'
import { findCreator, getPatternsByCreator } from '@/lib/data'
import type { Difficulty } from '@/lib/types'

const levels: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']

/** "Beginner", or "Beginner to Advanced" when the patterns span levels */
function levelRange(found: Difficulty[]) {
  const used = levels.filter((l) => found.includes(l))
  if (used.length === 0) return null
  return used.length === 1 ? used[0] : `${used[0]} to ${used[used.length - 1]}`
}

/** "€12", or "€10–13" */
function priceRange(prices: number[]) {
  if (prices.length === 0) return null
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  return lo === hi ? `€${lo}` : `€${lo}–${hi}`
}

/**
 * A maker's page, built like your own You page: their card on the side (the same ProfileHeader), their
 * patterns beside it, where yours are on You.
 * Only real, verifiable facts, all worked out from their patterns. Follower counts and "made by"
 * counts come back when they're measured.
 */
export default function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const creator = findCreator(id)
  if (!creator) {
    return (
      <NotFoundMessage
        title="This maker isn’t on Sigrid"
        description="The link may be old or mistyped, or the maker has left. Their patterns you bought are still yours."
        action={{ label: 'See all makers', href: '/explore?view=makers' }}
      />
    )
  }
  const patterns = getPatternsByCreator(id)
  const levelText = levelRange(patterns.map((p) => p.difficulty))
  const priceText = priceRange(patterns.map((p) => p.price))
  const stats = [
    { label: 'Patterns', value: patterns.length.toString() },
    ...(levelText ? [{ label: 'Levels', value: levelText }] : []),
    ...(priceText ? [{ label: 'Prices', value: priceText }] : []),
  ]

  return (
    <PageContainer>
      <TopBar breadcrumbs={[{ label: 'Explore', href: '/explore?view=makers' }, { label: creator.handle }]} />

      <div className="grid-12">
        <ProfileHeader
          className="col-side"
          avatar={<CreatorAvatar creator={creator} size="profile" />}
          name={creator.name}
          subtitle={creator.handle}
          label="Pattern maker"
          labelDetail="Example profile"
          bio={creator.bio}
          stats={stats}
        />

        <div className="col-main">
          <ProductGrid label="Their patterns" meta={patterns.length}>
            {patterns.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">No patterns published yet.</p>
            ) : (
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
            )}
          </ProductGrid>
        </div>
      </div>
    </PageContainer>
  )
}
