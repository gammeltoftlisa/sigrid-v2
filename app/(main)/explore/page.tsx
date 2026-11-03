'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from 'cn'
import { IconAdjustmentsHorizontal, IconZoomQuestion } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { GarmentImage } from '@/components/garment/GarmentImage'
import { SearchSuggest, type SuggestionGroup } from '@/components/patterns/search-suggest'
import { GarmentCard } from '@/components/patterns/garment-card'
import { KeepHeight } from '@/components/patterns/keep-height'
import { MakerCard } from '@/components/patterns/maker-card'
import { PanelSheet } from '@/components/patterns/panel-sheet'
import { ProductGrid } from '@/components/patterns/product-grid'
import { ShopLayout } from '@/components/shop/shop-layout'
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

/**
 * Everything there is to discover, laid out like the Shop: one bar that stays at the top with the switch between
 * patterns and makers, the search and the dropdowns. On phones the dropdowns open in a sheet from a Filters button,
 * and the switch sits just under the bar.
 */
export default function ExplorePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const params = use(searchParams)
  const router = useRouter()
  // In the link, so coming back from a maker lands on Makers again
  const view: View = params.view === 'makers' ? 'Makers' : 'Patterns'
  const setView = (next: View) => router.replace(next === 'Makers' ? '/explore?view=makers' : '/explore', { scroll: false })

  // What's typed drives the suggestions; what's searched (Enter, or See all) drives the grid
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [category, setCategory] = useState<GarmentCategory | 'All'>('All')
  const [level, setLevel] = useState<Difficulty | 'All'>('All')
  const matcher = (q: string) => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return (...texts: (string | undefined)[]) => {
      const hay = texts.filter(Boolean).join(' ').toLowerCase()
      return words.every((w) => hay.includes(w))
    }
  }
  const has = matcher(applied)
  const query = applied.trim()

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
    return has(g.name, maker?.handle, maker?.name, g.category, g.difficulty)
  })
  const makers = creators.filter((c) => has(c.name, c.handle, c.bio))

  // As you type: the patterns and makers that match, whatever the filters, each opening its own page
  const typed = matcher(search)
  const suggestions: SuggestionGroup[] = search.trim()
    ? [
        {
          label: 'Patterns',
          items: everything
            .filter((g) => typed(g.name, makerOf(g)?.handle, makerOf(g)?.name, g.category, g.difficulty))
            .slice(0, 5)
            .map((g) => ({
              id: g.id,
              title: g.name,
              detail: [g.published ? 'Your pattern' : (makerOf(g)?.handle ?? 'Sigrid'), g.difficulty, `€${g.price}`].join(' · '),
              media: <GarmentImage name={g.name} photoSrc={g.photo} sizes="40px" className="size-full" />,
              href: `/garment/${g.id}`,
            })),
        },
        {
          label: 'Makers',
          items: creators
            .filter((c) => typed(c.name, c.handle, c.bio))
            .slice(0, 3)
            .map((c) => {
              const count = getPatternsByCreator(c.id).length
              return {
                id: c.id,
                title: c.name,
                detail: `${c.handle} · ${count} ${count === 1 ? 'pattern' : 'patterns'}`,
                media: <CreatorAvatar creator={c} className="size-full" />,
                href: `/creator/${c.id}`,
              }
            }),
        },
      ]
    : []

  const filtering = !!query || category !== 'All' || level !== 'All'
  const clearFilters = () => {
    setSearch('')
    setApplied('')
    setCategory('All')
    setLevel('All')
  }

  const [filtersOpen, setFiltersOpen] = useState(false)
  const chosen = (category !== 'All' ? 1 : 0) + (level !== 'All' ? 1 : 0)

  const otherView: View = view === 'Patterns' ? 'Makers' : 'Patterns'
  const otherCount = view === 'Patterns' ? makers.length : patterns.length

  const typeSelect = (className?: string) => (
    <Select items={typeOptions} value={category} onValueChange={(v) => setCategory(v as GarmentCategory | 'All')}>
      <SelectTrigger aria-label="Type" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {typeOptions.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  const levelSelect = (className?: string) => (
    <Select items={levels} value={level} onValueChange={(v) => setLevel(v as Difficulty | 'All')}>
      <SelectTrigger aria-label="Level" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {levels.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  const viewSwitch = <CategoryTabs label="What to explore" options={views} value={view} onValueChange={setView} />

  return (
    <ShopLayout
      title="Explore"
      lead={<div className="hidden shrink-0 md:block">{viewSwitch}</div>}
      search={
        <SearchSuggest
          label="Search patterns and makers"
          placeholder="Search patterns and makers"
          value={search}
          onValueChange={setSearch}
          onSubmit={setApplied}
          groups={view === 'Patterns' ? suggestions : [...suggestions].reverse()}
        />
      }
      actions={
        view === 'Patterns' && (
          <>
            <div className="hidden items-center gap-2 md:flex">
              {typeSelect('w-36')}
              {levelSelect('w-40')}
            </div>
            <Button variant="outline" size="lg" className="md:hidden" aria-label={chosen > 0 ? `Filters, ${chosen} chosen` : 'Filters'} onClick={() => setFiltersOpen(true)}>
              <IconAdjustmentsHorizontal data-icon="inline-start" />
              {chosen > 0 ? <span className="tabular-nums">{chosen}</span> : <span className="max-sm:sr-only">Filters</span>}
            </Button>
          </>
        )
      }
      nav={
        <div className={cn('flex flex-wrap items-center gap-2', !filtering && 'md:hidden')}>
          <div className="md:hidden">{viewSwitch}</div>
          {filtering && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={clearFilters}>
              Clear search and filters
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
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
              <div className="tiles">
                {patterns.map((g) => (
                  <GarmentCard
                    key={g.id}
                    href={`/garment/${g.id}`}
                    name={g.name}
                    difficulty={g.difficulty}
                    byline={g.published ? 'Your pattern' : (makerOf(g)?.handle ?? 'Sigrid')}
                    price={g.price}
                    photoSrc={g.photo}
                    photos={g.photos}
                    tag={hasGuide(g) ? undefined : 'Coming soon'}
                  />
                ))}
              </div>
            </ProductGrid>
          ) : (
            <ProductGrid>
              <div className="maker-rows">
                {makers.map((c) => (
                  <MakerCard key={c.id} creator={c} patterns={getPatternsByCreator(c.id)} />
                ))}
              </div>
            </ProductGrid>
          )}
        </KeepHeight>
      </div>

      <PanelSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filters"
        footer={
          <>
            <Button variant="outline" className="flex-1" disabled={chosen === 0} onClick={() => { setCategory('All'); setLevel('All') }}>Clear</Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>Show {patterns.length} {patterns.length === 1 ? 'pattern' : 'patterns'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-2 px-4 pb-4">
          {typeSelect('w-full')}
          {levelSelect('w-full')}
        </div>
      </PanelSheet>
    </ShopLayout>
  )
}
