'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconLeaf, IconShirt, IconZoomQuestion } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { FabricBagButton, FabricBagSheet } from '@/components/patterns/fabric-bag'
import { FabricCard } from '@/components/patterns/fabric-card'
import { GarmentThumb } from '@/components/patterns/fabric-choices'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { supplyIcon } from '@/components/patterns/supply-icon'
import { ProductGrid } from '@/components/patterns/product-grid'
import { StatusMessage } from '@/components/patterns/status-message'
import { useMounted } from '@/hooks/use-mounted'
import { FilterDropdown, PriceDropdown } from './filter-dropdown'
import { FilterTags, type FilterTag } from './filter-tags'
import { ShopLayout } from './shop-layout'
import { getGarmentById } from '@/lib/data'
import { isPublishedId } from '@/lib/published'
import { addToBag, removeFromBag, useBag } from '@/lib/fabric/bag'
import { activeFilterCount, facets, noFilters, passes, type FabricFilters } from '@/lib/fabric/filters'
import { marketplaces } from '@/lib/fabric/marketplaces'
import { getFabricNeed, metersFor } from '@/lib/fabric/needs'
import { findSupply, suppliesFor } from '@/lib/fabric/supplies'
import { approxEur, costFor, coversLength, formatMeters, pricePerMeter, unitsFor } from '@/lib/fabric/pricing'
import type { FabricListing, FabricSearchResponse } from '@/lib/fabric/types'
import { loadProject } from '@/lib/projects'
import { loadSavedSize, sizeLabel } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'


type Sort = 'match' | 'price'

type Result = { key: string } & ({ state: 'done'; data: FabricSearchResponse } | { state: 'error' })
type Load = { state: 'loading' } | Result

interface Params {
  garment?: string
  choice?: string
  /** One of the pattern's other supplies, instead of its fabric */
  supply?: string
}

const hrefFor = (p: Params) => {
  const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString()
  return qs ? `/fabric?${qs}` : '/fabric'
}

/** What one pattern needs: its fabric and supplies, for its size. The whole store is ShopPage. */
export function PatternFabric({ params }: { params: Params }) {
  const router = useRouter()
  const mounted = useMounted()
  const bag = useBag()
  const [bagOpen, setBagOpen] = useState(false)

  // A pattern published from the studio lives in this browser: wait until mounted to look it up
  const garment = params.garment && (!isPublishedId(params.garment) || mounted) ? getGarmentById(params.garment) : null
  const need = garment ? getFabricNeed(garment.id) : null
  // A recommended fabric to narrow to, or null for all of them
  const supply = garment ? findSupply(garment.id, params.supply) : null
  const choice = supply ? null : (need?.choices.find((c) => c.id === params.choice) ?? null)

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
  const fabricMeters = need && size ? metersFor(need, size) : undefined
  // A supply is bought by the item, whatever the size
  const meters = supply ? undefined : fabricMeters

  // What to ask the API for
  // A garment asks for all its recommended fabrics at once; picking one filters on the page
  const apiQuery = supply?.search
    ? `q=${encodeURIComponent(supply.search)}`
    : garment?.published
      ? `q=${encodeURIComponent(need!.choices[0].query)}`
      : `garment=${garment?.id}`
  const garmentReady = !!garment
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const requestKey = `${apiQuery}/${attempt}`
  const load: Load = result?.key === requestKey ? result : { state: 'loading' }

  useEffect(() => {
    if (!garmentReady) return
    const ctrl = new AbortController()
    // The server gives up on slow shops well before this; the limit is for a stalled connection
    fetch(`/api/fabrics?${apiQuery}`, { signal: AbortSignal.any([ctrl.signal, AbortSignal.timeout(30_000)]) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: FabricSearchResponse) => {
        if (!Array.isArray(data?.listings) || !Array.isArray(data?.sources)) throw new Error('Unexpected answer')
        setResult({ key: requestKey, state: 'done', data })
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) {
          console.warn(e)
          setResult({ key: requestKey, state: 'error' })
        }
      })
    return () => ctrl.abort()
  }, [apiQuery, requestKey, garmentReady])

  // Condition, shop and price filters stay when the category or search changes, like in a store
  const [filters, setFilters] = useState<FabricFilters>(noFilters)
  const [sort, setSort] = useState<Sort>('match')
  // Show a page of results at a time, so phones don't get one endless list
  const PAGE = 24
  const [shownCount, setShownCount] = useState(PAGE)
  const listKey = `${requestKey}-${choice?.id}-${sort}-${JSON.stringify(filters)}`
  const [prevListKey, setPrevListKey] = useState(listKey)
  if (listKey !== prevListKey) {
    setPrevListKey(listKey)
    setShownCount(PAGE)
  }
  const [filtersOpen, setFiltersOpen] = useState(false)

  const isNotions = !!supply
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
  const silent = load.state === 'done' ? load.data.sources.filter((s) => s.failed) : []
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

  const secondhandQuery = need?.secondhandQuery ?? 'tyg'
  const secondhandLinks = (
    <p className="text-muted-foreground">
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

  // A pattern from the studio that isn't in this browser
  if (mounted && !garment) {
    return (
      <PageContainer>
        <PageHeader title="Find fabric" />
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>This pattern isn’t here</EmptyTitle>
            <EmptyDescription>Everything is still in the shop.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" nativeButton={false} render={<Link href="/fabric" />}>Go to the shop</Button>
          </EmptyContent>
        </Empty>
      </PageContainer>
    )
  }

  if (!garment || !need || !size || !fabricMeters) return <ShopLayoutLoading />

  const f = facets(all, filters)
  const labelIn = (options: { value: string; label: string }[], value: string) => options.find((o) => o.value === value)?.label ?? value
  const tags: FilterTag[] = [
    ...activeFilters.conditions.map((c) => ({ id: `condition:${c}`, label: labelIn(f.conditions, c), onRemove: () => setFilters({ ...filters, conditions: filters.conditions.filter((x) => x !== c) }) })),
    ...activeFilters.fibres.map((v) => ({ id: `fibre:${v}`, label: v, onRemove: () => setFilters({ ...filters, fibres: filters.fibres.filter((x) => x !== v) }) })),
    ...(activeFilters.price ? [{ id: 'price', label: `€${activeFilters.price.min}–€${activeFilters.price.max}`, onRemove: () => setFilters({ ...filters, price: null }) }] : []),
    ...activeFilters.shops.map((s) => ({ id: `shop:${s}`, label: labelIn(f.shops, s), onRemove: () => setFilters({ ...filters, shops: filters.shops.filter((x) => x !== s) }) })),
  ]
  const everything = [...suppliesFor(garment.id).special, ...suppliesFor(garment.id).basics]
  const needed = supply?.id ?? 'fabric'
  const neededItems = [{ value: 'fabric', label: `Fabric · ${formatMeters(fabricMeters)}` }, ...everything.map((s) => ({ value: s.id, label: s.name }))]

  const panel = (
    <>
      {/* You came from this pattern, and everything beside it is what it needs */}
      <div className="flex items-center gap-2 rounded-(--control-radius) border p-1.5">
        <GarmentThumb id={garment.id} name={garment.name} photoSrc={garment.photo} />
        <Link href={`/garment/${garment.id}`} className="min-w-0 flex-1 text-sm font-medium underline-offset-4 outline-none hover:underline">{garment.name}</Link>
      </div>

      <Select
        items={neededItems}
        value={needed}
        onValueChange={(v) => router.replace(v === 'fabric' ? hrefFor({ garment: garment.id }) : hrefFor({ garment: garment.id, supply: v as string }), { scroll: false })}
      >
        <SelectTrigger aria-label="What you’ll need" className="w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fabric">
            <IconShirt aria-hidden />
            Fabric · {formatMeters(fabricMeters)}
          </SelectItem>
          {everything.map((s) => {
            const Icon = supplyIcon(s)
            return (
              <SelectItem key={s.id} value={s.id} disabled={!s.search}>
                <Icon aria-hidden />
                {s.name}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      <Select items={sizes.map((s) => ({ value: s, label: `Size ${sizeLabel(s)}` }))} value={size} onValueChange={(v) => setPickedSize(v as StandardSize)}>
        <SelectTrigger aria-label="Your size" className="w-full bg-background tabular-nums">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sizes.map((s) => (
            <SelectItem key={s} value={s}>Size {sizeLabel(s)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!supply && (
        <Select
          items={[{ value: 'all', label: 'All recommended' }, ...need.choices.map((c) => ({ value: c.id, label: c.name }))]}
          value={choice?.id ?? 'all'}
          onValueChange={(v) => router.replace(hrefFor({ garment: garment.id, choice: v === 'all' ? undefined : (v as string) }), { scroll: false })}
        >
          <SelectTrigger aria-label="Recommended fabric" className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All recommended
              {choiceCounts && <span className="ml-auto text-xs text-muted-foreground tabular-nums">{choiceCounts.all}</span>}
            </SelectItem>
            {need.choices.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.isEco && <IconLeaf aria-hidden />}
                {c.name}
                {choiceCounts && <span className="ml-auto text-xs text-muted-foreground tabular-nums">{choiceCounts[c.id]}</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Why this fabric suits the garment: only once one is chosen */}
      {choice && !supply && (
        <p className="px-1 text-xs text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground">{choice.ease}.</span> {choice.why}
        </p>
      )}

      <Select
        items={[
          { value: 'match', label: 'Best match' },
          { value: 'price', label: priceSortLabel },
        ]}
        value={sort}
        onValueChange={(v) => setSort(v as Sort)}
      >
        <SelectTrigger aria-label="Sort" className="w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="match">Best match</SelectItem>
          <SelectItem value="price">{priceSortLabel}</SelectItem>
        </SelectContent>
      </Select>

      {!isNotions && f.conditions.some((o) => o.count > 0) && <FilterDropdown label="Condition" options={f.conditions} value={filters.conditions} onChange={(v) => setFilters({ ...filters, conditions: v as FabricFilters['conditions'] })} />}
      {!isNotions && f.fibres.length > 0 && <FilterDropdown label="Fibre" options={f.fibres} value={filters.fibres} onChange={(v) => setFilters({ ...filters, fibres: v })} />}
      {!isNotions && f.price && <PriceDropdown label="Price per metre" bounds={f.price} value={filters.price} onChange={(price) => setFilters({ ...filters, price })} />}
      {f.shops.length > 1 && <FilterDropdown label="Shop" options={f.shops} value={filters.shops} onChange={(v) => setFilters({ ...filters, shops: v })} />}
    </>
  )

  return (
    <>
      <ShopLayout
        title={supply ? supply.name : 'Find fabric'}
        breadcrumbs={[{ label: garment.name, href: `/garment/${garment.id}` }, { label: supply ? supply.name : 'Fabric' }]}
        actions={<FabricBagButton count={bag.length} onClick={() => setBagOpen(true)} />}
        panelLabel={load.state === 'done' ? `${listings.length} results` : 'Looking…'}
        panelMeta={!supply ? `Need ${formatMeters(fabricMeters)}` : undefined}
        panel={panel}
        sheetTitle="This pattern"
        sheetOpen={filtersOpen}
        onSheetOpenChange={setFiltersOpen}
        chosenCount={filterCount}
        sheetFooter={
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
        <FilterTags tags={tags} onClear={() => setFilters(noFilters)} />

        {load.state === 'loading' && (
          <ProductGrid className="shop-results" aria-busy="true" aria-label="Looking through the shops">
            <div className="shop-scroll">
              <div className="tiles">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-product rounded-none" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ))}
              </div>
            </div>
          </ProductGrid>
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
                    : supply
                      ? `No shop has ${supply.name.toLowerCase()} right now. Try a local haberdashery.`
                      : choice
                        ? `No shop has ${choice.name.toLowerCase()} right now. Try all recommended fabrics.`
                        : 'Try the whole shop.'}
                </EmptyDescription>
              </EmptyHeader>
              {filterCount > 0 && (
                <EmptyContent>
                  <Button variant="outline" onClick={() => setFilters(noFilters)}>Clear filters</Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <ProductGrid className="shop-results">
              <div className="shop-scroll">
                <div key={listKey} className="tiles">
                  {listings.slice(0, shownCount).map((l, i) => (
                    <FabricCard key={l.id} eager={i < 6} listing={l} meters={meters} size={size} inBag={inBag.has(l.id)} onToggleBag={() => toggleBag(l)} />
                  ))}
                </div>
                <div className="flex flex-col items-center gap-3 p-3">
                  {listings.length > shownCount && (
                    <Button variant="outline" onClick={() => setShownCount((n) => n + PAGE)}>
                      Show {Math.min(PAGE, listings.length - shownCount)} more
                      <span className="text-muted-foreground tabular-nums">· {shownCount} of {listings.length}</span>
                    </Button>
                  )}
                  {silent.length > 0 && <p className="w-full text-xs text-muted-foreground">{silent.map((s) => s.name).join(' and ')} didn’t answer, so these results may be missing some.</p>}
                  {!isNotions && <div className="w-full text-xs">{secondhandLinks}</div>}
                  <p className="w-full text-xs text-muted-foreground">
                    You buy from the shop itself. Some shops may pay Sigrid a commission, which never changes your price.
                  </p>
                </div>
              </div>
            </ProductGrid>
          ))}
      </ShopLayout>

      <FabricBagSheet items={bag} open={bagOpen} onOpenChange={setBagOpen} />
    </>
  )
}

/** While a studio pattern is still being found in this browser */
function ShopLayoutLoading() {
  return <PageContainer className="fit-screen" />
}
