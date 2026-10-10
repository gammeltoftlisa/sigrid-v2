'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconSearch, IconZoomQuestion } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { PageSection } from '@/components/patterns/page-section'
import { creatorPatterns, creators } from '@/lib/data'
import type { Difficulty, GarmentCategory } from '@/lib/types'

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear'] as const satisfies readonly (GarmentCategory | 'All')[]
const difficulties: { value: Difficulty | 'All'; label: string }[] = [
  { value: 'All', label: 'Any level' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
]

export default function ExplorePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All')

  const query = search.trim().toLowerCase()
  const filtered = creatorPatterns.filter((p) => {
    if (category !== 'All' && p.category !== category) return false
    if (difficulty !== 'All' && p.difficulty !== difficulty) return false
    if (query) {
      const handle = creators.find((c) => c.id === p.creatorId)?.handle.toLowerCase() ?? ''
      if (!p.name.toLowerCase().includes(query) && !handle.includes(query)) return false
    }
    return true
  })
  const filtering = !!query || category !== 'All' || difficulty !== 'All'

  const clearFilters = () => {
    setSearch('')
    setCategory('All')
    setDifficulty('All')
  }

  return (
    <PageContainer>
      <PageHeader title="Explore" description="Patterns from independent creators, drafted in your size." />

      <div className="flex flex-col gap-3">
        <InputGroup className="h-11">
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search patterns or creators"
            placeholder="Search patterns or creators"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CategoryTabs label="Filter by category" options={categories} value={category} onValueChange={setCategory} />
          <Select
            items={difficulties}
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as Difficulty | 'All')}
          >
            <SelectTrigger aria-label="Difficulty" className="h-9 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!filtering && (
        <PageSection title="Featured creators">
          <ul className="scroll-row -mx-4 flex gap-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {creators.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link
                  href={`/creator/${c.id}`}
                  className="group flex w-40 flex-col gap-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <CreatorAvatar creator={c} size="lg" className="size-16 text-lg" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium group-hover:underline group-hover:underline-offset-4">{c.handle}</span>
                    <span className="text-sm text-muted-foreground">{c.followerCount} followers</span>
                    {c.isCertified && <span className="eyebrow mt-1 text-muted-foreground">Certified</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </PageSection>
      )}

      <PageSection
        title={filtering ? `${filtered.length} ${filtered.length === 1 ? 'pattern' : 'patterns'}` : 'All patterns'}
        action={
          filtering && filtered.length > 0 ? (
            <Button variant="link" className="px-0" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : undefined
        }
      >
        {filtered.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconZoomQuestion />
              </EmptyMedia>
              <EmptyTitle>No patterns match</EmptyTitle>
              <EmptyDescription>Try another word, or fewer filters.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div key={`${category}-${difficulty}`} className="tile-grid grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <GarmentCard
                key={p.id}
                href={`/garment/${p.garmentId}`}
                name={p.name}
                difficulty={p.difficulty}
                byline={creators.find((c) => c.id === p.creatorId)?.handle}
                price={p.price}
              />
            ))}
          </div>
        )}
      </PageSection>
    </PageContainer>
  )
}
