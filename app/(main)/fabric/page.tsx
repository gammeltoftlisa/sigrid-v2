'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconAdjustmentsHorizontal, IconSearch, IconZoomQuestion } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { FabricBagButton, FabricBagSheet } from '@/components/patterns/fabric-bag'
import { PanelSheet } from '@/components/patterns/panel-sheet'
import { FabricCard } from '@/components/patterns/fabric-card'
import { KeepHeight } from '@/components/patterns/keep-height'
import { ActiveFilters, FabricFilterGroups, FabricFilterPills } from '@/components/patterns/fabric-filters'
import { FabricChoices, GarmentThumb } from '@/components/patterns/fabric-choices'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel } from '@/components/patterns/panel'
import { StatusMessage } from '@/components/patterns/status-message'
import { useMounted } from '@/hooks/use-mounted'
import { garments, getGarmentById } from '@/lib/data'
import { isPublishedId, listPublishedGarments } from '@/lib/published'
import { addToBag, removeFromBag, useBag } from '@/lib/fabric/bag'
import { cleanSearch, departments, getDepartment } from '@/lib/fabric/catalog'
import { activeFilterCount, noFilters, passes, type FabricFilters } from '@/lib/fabric/filters'
import { marketplaces } from '@/lib/fabric/marketplaces'
import { getFabricNeed, metersFor } from '@/lib/fabric/needs'
import { approxEur, costFor, coversLength, formatMeters, pricePerMeter, unitsFor } from '@/lib/fabric/pricing'
import type { FabricListing, FabricSearchResponse } from '@/lib/fabric/types'
import { listProjects } from '@/lib/project-summary'
import { loadProject } from '@/lib/projects'
import { loadSavedSize, sizeLabel } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'

const modes = ['All fabric', 'For a garment'] as const
type Mode = (typeof modes)[number]

type Sort = 'match' | 'price'

type Result = { key: string } & ({ state: 'done'; data: FabricSearchResponse } | { state: 'error' })
type Load = { state: 'loading' } | Result

interface Params {
  garment?: string
  choice?: string
  department?: string
  q?: string
}

const hrefFor = (p: Params) => {
  const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString()
  return qs ? `/fabric?${qs}` : '/fabric'
}

export default function FabricPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = use(searchParams)
  const router = useRouter()
  const mounted = useMounted()
  const bag = useBag()
  const [bagOpen, setBagOpen] = useState(false)

  // No garment in the link: the whole store. With one: exactly what that garment needs.
  const mode: Mode = params.garment ? 'For a garment' : 'All fabric'
  // A pattern published from the studio lives in this browser: wait until mounted to look it up
  const garment = params.garment && (!isPublishedId(params.garment) || mounted) ? getGarmentById(params.garment) : null
  const garmentOptions = [...garments, ...(mounted ? listPublishedGarments() : [])]
  const need = garment ? getFabricNeed(garment.id) : null
  // A recommended fabric to narrow to, or null for all of them
  const choice = need?.choices.find((c) => c.id === params.choice) ?? null
  const department = garment ? undefined : getDepartment(params.department)
  const search = garment || department ? '' : cleanSearch(params.q)

  // Size, for the garment view: picked here, else the project's, else the profile's, else a middle size
  const [pickedSize, setPickedSize] = useState<StandardSize | null>(null)
  const sizes = garment?.sizes ?? []
  const remembered = mounted && garment ? (loadProject(garment.id)?.size ?? loadSavedSize()) : null
  const size: StandardSize | undefined = !garment
    ? undefined
    : pickedSize && sizes.includes(pickedSize)
      ? pickedSize
      : remembered && sizes.includes(remembered)
        ? remembered
        : sizes.includes('M')
          ? 'M'
          : sizes[0]
  const meters = need && size ? metersFor(need, size) : undefined

  // What to ask the API for
  // A garment asks for all its recommended fabrics at once; picking one filters on the page
  const apiQuery = garment
    ? garment.published
      ? `q=${encodeURIComponent(need!.choices[0].query)}`
      : `garment=${garment.id}`
    : department
      ? `department=${department.id}`
      : search
        ? `q=${encodeURIComponent(search)}`
        : ''
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const requestKey = `${apiQuery}/${attempt}`
  const load: Load = result?.key === requestKey ? result : { state: 'loading' }

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`/api/fabrics?${apiQuery}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: FabricSearchResponse) => setResult({ key: requestKey, state: 'done', data }))
      .catch((e) => {
        if (!ctrl.signal.aborted) {
          console.warn(e)
          setResult({ key: requestKey, state: 'error' })
        }
      })
    return () => ctrl.abort()
  }, [apiQuery, requestKey])

  // Condition, shop and price filters stay when the category or search changes, like in a store
  const [filters, setFilters] = useState<FabricFilters>(noFilters)
  const [sort, setSort] = useState<Sort>('match')
  // Show a page of results at a time, so phones don't get one endless list
  const PAGE = 12
  const [shownCount, setShownCount] = useState(PAGE)
  const listKey = `${requestKey}-${choice?.id}-${sort}-${JSON.stringify(filters)}`
  const [prevListKey, setPrevListKey] = useState(listKey)
  if (listKey !== prevListKey) {
    setPrevListKey(listKey)
    setShownCount(PAGE)
  }
  const [filtersOpen, setFiltersOpen] = useState(false)
  // A new category or search is usually a different fibre, so the fibre filter starts over
  const clearFibres = () => setFilters((f) => ({ ...f, fibres: [] }))

  const isNotions = department?.kind === 'notion'
  const all = load.state === 'done' ? load.data.listings : []
  const activeFilters = isNotions ? { ...filters, conditions: [], fibres: [], price: null } : filters
  const matches = load.state === 'done' ? load.data.matches : undefined
  const suitsChoice = (l: FabricListing) => !choice || !matches || (matches[l.id] ?? []).includes(choice.id)
  const shown = all.filter((l) => suitsChoice(l) && passes(l, activeFilters))
  // How many listings suit each recommended fabric, after the other filters
  const choiceCounts =
    need && matches
      ? Object.fromEntries([
          ['all', all.filter((l) => passes(l, activeFilters)).length],
          ...need.choices.map((c) => [c.id, all.filter((l) => (matches[l.id] ?? []).includes(c.id) && passes(l, activeFilters)).length]),
        ])
      : undefined
  const shopNames = new Map(all.map((l) => [l.sourceId, l.sourceName]))
  const filterCount = activeFilterCount(activeFilters)
  const priceOf = (l: FabricListing) => approxEur(meters ? costFor(l, meters) : (pricePerMeter(l) ?? l.unitPrice), l.currency)
  const listings =
    sort === 'match'
      ? shown
      : [...shown].sort((a, b) => {
          // Pieces too short for the garment go last
          const short = meters ? Number(coversLength(a, meters) === false) - Number(coversLength(b, meters) === false) : 0
          return short || priceOf(a) - priceOf(b)
        })
  const silent = load.state === 'done' ? load.data.sources.filter((s) => !s.ok && s.note === 'Didn’t answer in time') : []
  const inBag = new Set(bag.map((i) => i.listing.id))
  const priceSortLabel = meters ? 'Lowest price for your size' : isNotions ? 'Lowest price' : 'Lowest price per metre'

  const toggleBag = (listing: FabricListing) => {
    if (inBag.has(listing.id)) {
      removeFromBag(listing.id)
      return
    }
    // Garment view: the length for the size. Store: one metre (or one item) to start, changeable in the bag.
    addToBag({ listing, units: unitsFor(listing, meters ?? 1), garmentId: garment?.id ?? '' })
    toast('Added to your bag', { action: { label: 'View bag', onClick: () => setBagOpen(true) } })
  }

  const setMode = (m: Mode) => {
    if (m === 'All fabric') return router.replace('/fabric', { scroll: false })
    const started = listProjects().find((p) => !p.finished)?.garment ?? garments[0]
    router.replace(hrefFor({ garment: started.id }), { scroll: false })
  }

  const secondhandQuery = need?.secondhandQuery ?? (search ? `${search} tyg` : 'tyg')
  const secondhandLinks = (
    <p className="text-sm text-muted-foreground">
      Secondhand in Sweden:{' '}
      {marketplaces.map((m, i) => (
        <span key={m.id}>
          {i > 0 && ' · '}
          <a href={m.searchUrl(secondhandQuery)} target="_blank" rel="noopener" className="text-foreground underline underline-offset-4 hover:no-underline">
            {m.name}
          </a>
        </span>
      ))}
    </p>
  )

  // Desktop: filters are one row of pills in the left panel (each opens its options). Phones open them in a sheet.
  const filtersInPanel = (
    <div className="hidden lg:block">
      <FabricFilterPills listings={all} filters={filters} onChange={setFilters} notions={isNotions} />
    </div>
  )
  const clearAction =
    filterCount > 0 ? (
      <Button variant="ghost" size="xs" className="-my-1 hidden lg:inline-flex" onClick={() => setFilters(noFilters)}>
        Clear {filterCount}
      </Button>
    ) : undefined

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Find fabric' }]}
        barActions={<FabricBagButton count={bag.length} onClick={() => setBagOpen(true)} />}
        title="Find fabric"
        description="From independent shops and secondhand sellers. You buy from the shop; some shops may pay Sigrid a commission, which never changes your price."
      />

      <CategoryTabs label="How to shop" options={modes} value={mode} onValueChange={setMode} />

      <div className="grid-12">
        <div className="col-side flex flex-col gap-6">
          {garment && need && size && meters ? (
            <Panel
              label="What you’re making"
              meta={<span aria-label={`You need ${formatMeters(meters)}`}>Need {formatMeters(meters)}</span>}
              action={clearAction}
            >
              <div className="flex items-center gap-2">
                <GarmentThumb id={garment.id} name={garment.name} photoSrc={garment.photo} />
                <Select
                  items={garmentOptions.map((g) => ({ value: g.id, label: g.name }))}
                  value={garment.id}
                  onValueChange={(v) => router.replace(hrefFor({ garment: v as string }), { scroll: false })}
                >
                  <SelectTrigger aria-label="Garment" className="min-w-0 flex-1 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {garmentOptions.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select items={sizes.map((s) => ({ value: s, label: sizeLabel(s) }))} value={size} onValueChange={(v) => setPickedSize(v as StandardSize)}>
                  <SelectTrigger aria-label={`Size ${sizeLabel(size)}`} className="w-18 shrink-0 bg-background tabular-nums">
                    {/* Just the letter in the narrow field; the list shows the EU size too */}
                    <SelectValue>{(v: StandardSize) => v}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {sizeLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FabricChoices
                choices={need.choices}
                value={choice?.id ?? null}
                counts={choiceCounts}
                onValueChange={(id) => router.replace(hrefFor({ garment: garment.id, choice: id ?? undefined }), { scroll: false })}
              />
              {filtersInPanel}
            </Panel>
          ) : (
            <StorePanel
              key={search}
              search={search}
              department={department?.id}
              onSearch={(q) => {
                clearFibres()
                router.push(hrefFor({ q }), { scroll: false })
              }}
              onDepartment={(d) => {
                clearFibres()
                router.replace(hrefFor({ department: d }), { scroll: false })
              }}
              action={clearAction}
            >
              {filtersInPanel}
            </StorePanel>
          )}

        </div>

        <KeepHeight className="col-main">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {load.state === 'loading' && 'Looking through the shops…'}
                {load.state === 'done' && (
                  <>
                    <span className="font-medium text-foreground tabular-nums">{listings.length}</span> {listings.length === 1 ? 'result' : 'results'}
                    {silent.length > 0 && ` · ${silent.map((s) => s.name).join(' and ')} didn’t answer`}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
                  <IconAdjustmentsHorizontal data-icon="inline-start" />
                  Filters{filterCount > 0 && <span className="tabular-nums"> · {filterCount}</span>}
                </Button>
                <Select
                  items={[
                    { value: 'match', label: 'Best match' },
                    { value: 'price', label: priceSortLabel },
                  ]}
                  value={sort}
                  onValueChange={(v) => setSort(v as Sort)}
                >
                  <SelectTrigger aria-label="Sort" className="w-auto bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Best match</SelectItem>
                    <SelectItem value="price">{priceSortLabel}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="lg:hidden">
              <ActiveFilters filters={activeFilters} onChange={setFilters} shopNames={shopNames} />
            </div>
          </div>

          {load.state === 'loading' && (
            <div className="tiles" aria-busy="true" aria-label="Looking through the shops">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-product rounded-none" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {load.state === 'error' && (
            <StatusMessage
              status="error"
              title="We couldn’t reach the shops"
              action={
                <Button variant="outline" size="sm" onClick={() => setAttempt((a) => a + 1)}>
                  Try again
                </Button>
              }
            >
              Your bag is safe. Check your connection and try again.
            </StatusMessage>
          )}

          {load.state === 'done' &&
            (listings.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconZoomQuestion />
                  </EmptyMedia>
                  <EmptyTitle>Nothing here right now</EmptyTitle>
                  <EmptyDescription>
                    {filterCount > 0
                      ? 'Remove a filter to see more.'
                      : choice
                        ? `No shop has ${choice.name.toLowerCase()} right now. Try all recommended fabrics.`
                        : 'Try another word or category.'}
                  </EmptyDescription>
                </EmptyHeader>
                {filterCount > 0 && (
                  <EmptyContent>
                    <Button variant="outline" onClick={() => setFilters(noFilters)}>
                      Clear filters
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div key={listKey} className="tile-grid tiles w-full">
                  {listings.slice(0, shownCount).map((l, i) => (
                    <FabricCard key={l.id} eager={i < 4} listing={l} meters={meters} size={size} inBag={inBag.has(l.id)} onToggleBag={() => toggleBag(l)} />
                  ))}
                </div>
                {listings.length > shownCount && (
                  <Button variant="outline" size="lg" onClick={() => setShownCount((n) => n + PAGE)}>
                    Show {Math.min(PAGE, listings.length - shownCount)} more
                    <span className="text-muted-foreground tabular-nums">· {shownCount} of {listings.length}</span>
                  </Button>
                )}
              </div>
            ))}

          {!isNotions && secondhandLinks}
        </div>
        </KeepHeight>
      </div>

      <FabricBagSheet items={bag} open={bagOpen} onOpenChange={setBagOpen} />

      {/* Phones and tablets: the same filters in a sheet */}
      <PanelSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filters"
        footer={
          <>
            <Button variant="outline" className="flex-1" disabled={filterCount === 0} onClick={() => setFilters(noFilters)}>
              Clear
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              Show {listings.length}
            </Button>
          </>
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <FabricFilterGroups listings={all} filters={filters} onChange={setFilters} notions={isNotions} flush />
        </div>
      </PanelSheet>
    </PageContainer>
  )
}

/** The store's left panel: search and category, then the filters. */
function StorePanel({
  search,
  department,
  onSearch,
  onDepartment,
  action,
  children,
}: {
  search: string
  department?: string
  onSearch: (q: string) => void
  onDepartment: (id: string) => void
  /** Small action in the panel header, e.g. clear filters */
  action?: React.ReactNode
  /** Filters, shown under search and category */
  children?: React.ReactNode
}) {
  const [text, setText] = useState(search)
  const categoryItems = [{ value: 'all', label: 'All fabric' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]

  return (
    <Panel label="Browse" action={action}>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            onSearch(cleanSearch(text))
          }}
        >
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <IconSearch />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Search fabric"
              placeholder="Washed linen, rib jersey…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </InputGroup>
        </form>
        <Select items={categoryItems} value={department ?? 'all'} onValueChange={(v) => onDepartment(v === 'all' ? '' : (v as string))}>
          <SelectTrigger aria-label="Category" className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fabric</SelectItem>
            {(['Fabric', 'Notions'] as const).map((group) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {departments
                  .filter((d) => d.group === group)
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {children}
    </Panel>
  )
}
