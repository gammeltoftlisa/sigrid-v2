'use client'

import { useState } from 'react'
import { IconSearch, IconZoomQuestion } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { GarmentCard } from '@/components/patterns/garment-card'
import { MakerCard } from '@/components/patterns/maker-card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel } from '@/components/patterns/panel'
import { PageSection } from '@/components/patterns/page-section'
import { KeepHeight } from '@/components/patterns/keep-height'
import { creatorPatterns, creators, getPatternsByCreator } from '@/lib/data'
import { useMounted } from '@/hooks/use-mounted'
import { listPublishedGarments } from '@/lib/published'
import type { Difficulty, GarmentCategory } from '@/lib/types'

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear'] as const satisfies readonly (GarmentCategory | 'All')[]
const difficulties: { value: Difficulty | 'All'; label: string }[] = [
  { value: 'All', label: 'All levels' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
]

export default function ExplorePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All')

  const query = search.trim().toLowerCase()
  // Patterns published from the studio on this device sit first, as "Your pattern"
  const mounted = useMounted()
  const yours = (mounted ? listPublishedGarments() : []).filter(
    (g) => (category === 'All' || g.category === category) && (difficulty === 'All' || g.difficulty === difficulty) && (!query || g.name.toLowerCase().includes(query)),
  )
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
      <PageHeader breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Explore' }]} title="Explore" description="Example patterns and maker profiles while Sigrid is in beta." />

      <PageSection title="Patterns">
        {/* Same as Home: category tabs, then a full-width grid; search and level sit on the same row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CategoryTabs label="Filter by category" options={categories} value={category} onValueChange={setCategory} />
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <InputGroup className="flex-1 sm:w-64 sm:flex-none">
              <InputGroupAddon>
                <IconSearch />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                aria-label="Search patterns or makers"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select items={difficulties} value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty | 'All')}>
              <SelectTrigger aria-label="Difficulty" className="w-36">
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

        <KeepHeight>
        {filtered.length === 0 && yours.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconZoomQuestion />
              </EmptyMedia>
              <EmptyTitle>Nothing matches yet</EmptyTitle>
              <EmptyDescription>Try a different word, or clear a filter to see more.</EmptyDescription>
            </EmptyHeader>
            {filtering && (
              <EmptyContent>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div key={`${category}-${difficulty}`} className="tile-grid tiles">
            {yours.map((g) => (
              <GarmentCard
                key={g.id}
                href={`/garment/${g.id}`}
                name={g.name}
                difficulty={g.difficulty}
                byline="Your pattern"
                price={g.price}
                photoSrc={g.photo}
              />
            ))}
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
        </KeepHeight>
      </PageSection>

      {/* Makers: a brown-glass panel with white cards in the same grid, like projects on Home */}
      <Panel label="Makers" meta={creators.length}>
        <div className="tiles !gap-y-3">
          {creators.map((c) => (
            <MakerCard key={c.id} creator={c} patterns={getPatternsByCreator(c.id)} />
          ))}
        </div>
      </Panel>
    </PageContainer>
  )
}
