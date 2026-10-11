'use client'

import { useState } from 'react'
import { IconSearch, IconZoomQuestion } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentCard } from '@/components/patterns/garment-card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel, PanelRow } from '@/components/patterns/panel'
import { creatorPatterns, creators } from '@/lib/data'
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

  const creatorRows = creators.map((c) => (
    <PanelRow
      key={c.id}
      href={`/creator/${c.id}`}
      leading={<CreatorAvatar creator={c} />}
      title={c.handle}
      detail={`${c.followerCount} followers${c.isCertified ? ' · Certified' : ''}`}
    />
  ))

  return (
    <PageContainer>
      <PageHeader breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Explore' }]} title="Explore" description="Patterns by independent makers, ready in your size." />

      <div className="grid gap-6 lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <Panel
            label="Find a pattern"
            meta={`${filtered.length} / ${creatorPatterns.length}`}
            footer={
              filtering ? (
                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          >
            <InputGroup className="h-11 bg-background">
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
            <Select items={difficulties} value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty | 'All')}>
              <SelectTrigger aria-label="Difficulty" className="h-11 w-full bg-background">
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
          </Panel>

          <Panel label="Featured creators" meta={creators.length} className="hidden lg:flex">
            {creatorRows}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b">
            <CategoryTabs label="Filter by category" options={categories} value={category} onValueChange={setCategory} />
          </div>

          {filtered.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconZoomQuestion />
                </EmptyMedia>
                <EmptyTitle>Nothing matches yet</EmptyTitle>
                <EmptyDescription>Try a different word, or clear a filter to see more.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div key={`${category}-${difficulty}`} className="tile-grid grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 2xl:grid-cols-4">
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

          {/* Phones and tablets: makers after the patterns */}
          <Panel label="Featured creators" meta={creators.length} className="lg:hidden">
            {creatorRows}
          </Panel>
        </div>
      </div>
    </PageContainer>
  )
}
