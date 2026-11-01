'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconSearch, IconZoomQuestion } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { GarmentCard } from '@/components/patterns/garment-card'
import { KeepHeight } from '@/components/patterns/keep-height'
import { MakerCard } from '@/components/patterns/maker-card'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { ProductGrid } from '@/components/patterns/product-grid'
import { useMounted } from '@/hooks/use-mounted'
import { catalogGarments, creators, getGuideOutline, getPatternsByCreator } from '@/lib/data'
import { listPublishedGarments } from '@/lib/published'
import type { Difficulty, Garment, GarmentCategory } from '@/lib/types'

const views = ['Patterns', 'Makers'] as const
type View = (typeof views)[number]

const allCategories: GarmentCategory[] = ['Tops', 'Bottoms', 'Dresses', 'Outerwear']
const levels: { value: Difficulty | 'All'; label: string }[] = [
  { value: 'All', label: 'All levels' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
]

const makerOf = (garment: Garment) => creators.find((c) => c.id === garment.creatorId)

/** Everything there is to discover: one search, and a clean view each for patterns and makers. */
export default function ExplorePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const params = use(searchParams)
  const router = useRouter()
  // In the link, so coming back from a maker lands on Makers again
  const view: View = params.view === 'makers' ? 'Makers' : 'Patterns'
  const setView = (next: View) => router.replace(next === 'Makers' ? '/explore?view=makers' : '/explore', { scroll: false })

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<GarmentCategory | 'All'>('All')
  const [level, setLevel] = useState<Difficulty | 'All'>('All')
  const query = search.trim().toLowerCase()
  const has = (...texts: (string | undefined)[]) => !query || texts.some((t) => t?.toLowerCase().includes(query))

  // Patterns published from the studio on this device sit first, as "Your pattern"
  const mounted = useMounted()
  const yours = mounted ? listPublishedGarments() : []
  const hasGuide = (g: Garment) => !!getGuideOutline(g.id)?.steps.length
  // What can be sewn today comes first
  const everything = [...yours, ...catalogGarments.filter(hasGuide), ...catalogGarments.filter((g) => !hasGuide(g))]
  const categories = allCategories.filter((c) => everything.some((g) => g.category === c))
  const typeOptions = [{ value: 'All', label: 'All types' }, ...categories.map((c) => ({ value: c, label: c }))]

  const patterns = everything.filter((g) => {
    if (category !== 'All' && g.category !== category) return false
    if (level !== 'All' && g.difficulty !== level) return false
    const maker = makerOf(g)
    return has(g.name, maker?.handle, maker?.name)
  })
  const makers = creators.filter((c) => has(c.name, c.handle, c.bio))

  const filtering = !!query || category !== 'All' || level !== 'All'
  const clearFilters = () => {
    setSearch('')
    setCategory('All')
    setLevel('All')
  }

  const otherView: View = view === 'Patterns' ? 'Makers' : 'Patterns'
  const otherCount = view === 'Patterns' ? makers.length : patterns.length

  return (
    <PageContainer>
      <PageHeader title="Explore" description="Example patterns and maker profiles while Sigrid is in beta." className="pt-8 md:pt-12" />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryTabs label="What to explore" options={views} value={view} onValueChange={setView} />
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            <InputGroup className="w-full sm:w-64">
              <InputGroupAddon>
                <IconSearch />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                aria-label="Search patterns and makers"
                placeholder="Search patterns and makers"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            {view === 'Patterns' && (
              <>
                <Select items={typeOptions} value={category} onValueChange={(v) => setCategory(v as GarmentCategory | 'All')}>
                  <SelectTrigger aria-label="Type" className="flex-1 sm:w-32 sm:flex-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select items={levels} value={level} onValueChange={(v) => setLevel(v as Difficulty | 'All')}>
                  <SelectTrigger aria-label="Level" className="flex-1 sm:w-36 sm:flex-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {filtering && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
          </div>
        </div>

        <KeepHeight>
          {(view === 'Patterns' ? patterns.length : makers.length) === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconZoomQuestion />
                </EmptyMedia>
                <EmptyTitle>No {view.toLowerCase()} match</EmptyTitle>
                <EmptyDescription>Try a different word, or clear what you’ve chosen.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex-row justify-center">
                <Button variant="outline" onClick={clearFilters}>Clear</Button>
                {otherCount > 0 && <Button onClick={() => setView(otherView)}>See {otherCount} {otherView.toLowerCase()}</Button>}
              </EmptyContent>
            </Empty>
          ) : view === 'Patterns' ? (
            <ProductGrid>
              <div key={`${category}-${level}`} className="tile-grid tiles">
                {patterns.map((g) => (
                  <GarmentCard
                    key={g.id}
                    href={`/garment/${g.id}`}
                    name={g.name}
                    difficulty={g.difficulty}
                    byline={g.published ? 'Your pattern' : (makerOf(g)?.handle ?? 'Sigrid')}
                    price={g.price}
                    photoSrc={g.photo}
                    tag={hasGuide(g) ? undefined : 'Coming soon'}
                  />
                ))}
              </div>
            </ProductGrid>
          ) : (
            <ProductGrid>
              <div className="tile-grid maker-rows">
                {makers.map((c) => (
                  <MakerCard key={c.id} creator={c} patterns={getPatternsByCreator(c.id)} />
                ))}
              </div>
            </ProductGrid>
          )}
        </KeepHeight>
      </div>
    </PageContainer>
  )
}
