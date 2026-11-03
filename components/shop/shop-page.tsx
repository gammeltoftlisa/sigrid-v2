'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconArrowRight, IconShirt, IconZoomQuestion, type Icon as TablerIcon } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { FabricBagButton, FabricBagSheet } from '@/components/patterns/fabric-bag'
import { ProductGrid } from '@/components/patterns/product-grid'
import { SearchSuggest, type Suggestion, type SuggestionGroup } from '@/components/patterns/search-suggest'
import { StatusMessage } from '@/components/patterns/status-message'
import { addToBag, removeFromBag, useBag } from '@/lib/fabric/bag'
import { marketplaces } from '@/lib/fabric/marketplaces'
import { formatMoney, unitsFor } from '@/lib/fabric/pricing'
import type { FabricListing } from '@/lib/fabric/types'
import { productHref } from '@/lib/shop/href'
import { categories, colours, facetLabels, getCategory, MULTICOLOUR, subLabel, type Category, type FacetId } from '@/lib/shop/taxonomy'
import type { ShopItem, ShopResponse, ShopRowsResponse, ShopSort } from '@/lib/shop/types'

import { categoryIcon, subcategoryIcon } from './category-icons'
import { CategoryRow } from './category-row'
import { ShopCard } from './shop-card'
import { FilterTags, type FilterTag } from './filter-tags'
import { ShopFilters } from './shop-filters'
import { ShopLayout } from './shop-layout'

type Params = Record<string, string | string[] | undefined>

const FACET_IDS = Object.keys(facetLabels) as FacetId[]
const SORTS: { value: ShopSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
]

const asList = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v])
const asOne = (v: string | string[] | undefined) => asList(v)[0]

/** Everything about what's showing lives in the link: back works, and it can be shared */
function readParams(params: Params) {
  const filters: Partial<Record<FacetId, string[]>> = {}
  for (const id of FACET_IDS) {
    const values = asList(params[id])
    if (values.length) filters[id] = values
  }
  const price = asOne(params.price)?.match(/^(\d+)-(\d+)$/)
  const sort = SORTS.find((s) => s.value === asOne(params.sort))?.value ?? 'featured'
  const category = getCategory(asOne(params.category))
  const sub = category?.subs.find((s) => s.name === asOne(params.sub))?.name
  return {
    category,
    sub,
    q: asOne(params.q)?.trim() ?? '',
    filters,
    price: price ? { min: Number(price[1]), max: Number(price[2]) } : null,
    sort,
  }
}

type State = ReturnType<typeof readParams>

function queryString(s: Pick<State, 'filters' | 'price' | 'q' | 'sort'> & { category?: Category; sub?: string }) {
  const qs = new URLSearchParams()
  if (s.category) qs.set('category', s.category.id)
  if (s.sub) qs.set('sub', s.sub)
  if (s.q) qs.set('q', s.q)
  for (const [id, values] of Object.entries(s.filters)) for (const v of values ?? []) qs.append(id, v)
  if (s.price) qs.set('price', `${s.price.min}-${s.price.max}`)
  if (s.sort !== 'featured') qs.set('sort', s.sort)
  return qs.toString()
}

const hrefFor = (s: Parameters<typeof queryString>[0]) => {
  const qs = queryString(s)
  return qs ? `/fabric?${qs}` : '/fabric'
}
const categoryHref = (id: string) => `/fabric?category=${id}`

/** A category you can go into, with its picture. The one you're in is softly tinted, so it says where you are without shouting. */
function Bubble({ href, active, icon: Icon, children }: { href: string; active?: boolean; icon: TablerIcon; children: React.ReactNode }) {
  return (
    <Button variant="outline" size="lg" nativeButton={false} className="category-bubble shrink-0" render={<Link href={href} scroll={false} aria-current={active ? 'page' : undefined} />}>
      <Icon data-icon="inline-start" aria-hidden />
      {children}
    </Button>
  )
}

/**
 * The way through the shop: every category as a bubble. Going into one replaces them with its
 * subcategories; the breadcrumbs above them go back up.
 */
function CategoryBubbles({ response, state }: { response: Pick<ShopResponse, 'categories' | 'subs'>; state: State }) {
  const { category, sub } = state
  return (
    <CategoryRow label="Categories">
      {category ? (
        <>
          <Bubble href={hrefFor({ ...state, sub: undefined })} active={!sub} icon={categoryIcon(category.id)}>All {category.name.toLowerCase()}</Bubble>
          {response.subs.map((s) => (
            <Bubble key={s.name} href={hrefFor({ ...state, sub: s.name })} active={s.name === sub} icon={subcategoryIcon(category.id, s.name)}>{subLabel(category, s.name)}</Bubble>
          ))}
        </>
      ) : (
        response.categories.filter((c) => c.count > 0).map((c) => (
          <Bubble key={c.id} href={categoryHref(c.id)} icon={categoryIcon(c.id)}>{c.name}</Bubble>
        ))
      )}
    </CategoryRow>
  )
}

function Skeletons() {
  return (
    <ProductGrid aria-busy="true" aria-label="Loading the shop">
      <div className="tiles">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-product rounded-none" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </ProductGrid>
  )
}

interface Loaded {
  key: string
  response: ShopResponse
  items: ShopItem[]
}

/** A colour's dot for its tag, when it's a colour we can draw */
function colourSwatch(value: string) {
  const hex = colours.find((c) => c.name === value)?.hex
  return hex || value === MULTICOLOUR ? { value, hex } : undefined
}

/** The bag, for both views of the store */
export function useShopBag() {
  const bag = useBag()
  const [bagOpen, setBagOpen] = useState(false)
  const inBag = new Set(bag.map((i) => i.listing.id))
  const toggleBag = (listing: FabricListing) => {
    if (inBag.has(listing.id)) {
      removeFromBag(listing.id)
      return
    }
    // One metre (or one item) to start, changeable in the bag
    addToBag({ listing, units: unitsFor(listing, 1), garmentId: '' })
    toast('Added to your bag', { action: { label: 'View bag', onClick: () => setBagOpen(true) } })
  }
  return { bag, bagOpen, setBagOpen, inBag, toggleBag }
}

/** The categories whose name (or a subcategory's) has all the typed words, as places to go */
function matchingCategories(text: string, within?: Category): Suggestion[] {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  const hits = (name: string) => words.every((w) => name.toLowerCase().includes(w))
  return (within ? [within] : categories).flatMap((c) => [
    ...(!within && hits(c.name) ? [{ id: c.id, title: c.name, detail: 'Category', media: (() => { const I = categoryIcon(c.id); return <I aria-hidden /> })(), href: categoryHref(c.id) }] : []),
    ...c.subs
      .filter((sub) => hits(sub.label ?? sub.name))
      .map((sub) => {
        const I = subcategoryIcon(c.id, sub.name)
        return { id: `${c.id}:${sub.name}`, title: sub.label ?? sub.name, detail: `In ${c.name.toLowerCase()}`, media: <I aria-hidden />, href: hrefFor({ category: c, sub: sub.name, filters: {}, price: null, q: '', sort: 'featured' }) }
      }),
  ]).slice(0, 4)
}

/**
 * The shop's search, suggesting as you type: matching categories straight away, and the first matching products
 * from the server a moment after the typing pauses. Inside a category it searches only there, as its words say.
 */
function ShopSearch({ category, q, onSearch }: { category?: Category; q: string; onSearch: (q: string) => void }) {
  const [text, setText] = useState(q)
  const [lastQ, setLastQ] = useState(q)
  if (q !== lastQ) {
    setLastQ(q)
    setText(q)
  }
  const where = category ? `Search ${category.name.toLowerCase()}` : 'Search the shop'

  const typed = text.trim()
  const [found, setFound] = useState<{ key: string; items: ShopItem[] } | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const key = `${category?.id ?? ''}|${typed.toLowerCase()}`
  useEffect(() => {
    if (!typed) return
    const ctrl = new AbortController()
    // Wait for a pause in the typing, so each letter doesn't ask the server
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: typed })
      if (category) params.set('category', category.id)
      fetch(`/api/shop?${params}`, { signal: AbortSignal.any([ctrl.signal, AbortSignal.timeout(15_000)]) })
        .then((r) => (r.ok ? (r.json() as Promise<ShopResponse>) : Promise.reject(new Error(String(r.status)))))
        .then((res) => {
          setFailedKey(null)
          setFound({ key, items: res.items.slice(0, 5) })
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setFailedKey(key)
        })
    }, 180)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [typed, category, key, attempt])

  const products = found?.key === key ? found.items : []
  const groups: SuggestionGroup[] = typed
    ? [
        { label: category ? 'In this category' : 'Categories', items: matchingCategories(typed, category) },
        {
          label: 'Products',
          items: products.map((item) => ({
            id: item.id,
            title: item.title,
            detail: `${item.sourceName} · ${formatMoney(item.unitPrice, item.currency)}${item.priceUnit ? ` ${item.priceUnit}` : ''}`,
            media: item.image ? <Image src={item.image} alt="" width={40} height={50} className="object-cover" /> : <IconShirt aria-hidden />,
            href: productHref(item) ?? item.url,
            external: !productHref(item),
          })),
        },
      ]
    : []

  return (
    <SearchSuggest
      label={where}
      placeholder={where}
      value={text}
      onValueChange={setText}
      onSubmit={(value) => onSearch(value)}
      groups={groups}
      loading={!!typed && found?.key !== key && failedKey !== key}
      failed={failedKey === key && products.length === 0}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  )
}

function RowSkeletons() {
  return Array.from({ length: 2 }, (_, row) => (
    <section key={row} className="flex flex-col gap-3" aria-busy="true" aria-label="Loading the shop">
      <Skeleton className="h-8 w-40" />
      <ProductGrid>
        <div className="tiles-row">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-product rounded-none" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </ProductGrid>
    </section>
  ))
}

/** The way into the store: a row of products per category, and no filters until you've gone into one */
function ShopHome({ state }: { state: State }) {
  const router = useRouter()
  const { bag, bagOpen, setBagOpen, inBag, toggleBag } = useShopBag()
  const [data, setData] = useState<ShopRowsResponse | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/shop?view=rows', { signal: AbortSignal.any([ctrl.signal, AbortSignal.timeout(30_000)]) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((response: ShopRowsResponse) => {
        setFailed(false)
        setData(response)
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return
        console.warn(e)
        setFailed(true)
      })
    return () => ctrl.abort()
  }, [attempt])

  return (
    <>
      <ShopLayout
        title="Shop"
        search={<ShopSearch q="" onSearch={(q) => q && router.push(hrefFor({ ...state, q }))} />}
        nav={data && <CategoryBubbles response={{ categories: data.categories, subs: [] }} state={state} />}
        actions={<FabricBagButton count={bag.length} onClick={() => setBagOpen(true)} />}
      >
        {failed && !data && (
          <StatusMessage
            status="error"
            title="We couldn’t open the shop"
            action={
              <Button variant="outline" size="sm" onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </Button>
            }
          >
            Your bag is safe. Check your connection and try again.
          </StatusMessage>
        )}
        <div className="flex flex-col gap-8">
          {!data && !failed && <RowSkeletons />}
          {data?.rows.map(({ category, items }, row) => (
            <section key={category.id} aria-labelledby={`shop-row-${category.id}`} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4 px-1">
                <h2 id={`shop-row-${category.id}`} className="page-section-title">{category.name}</h2>
                <Button variant="outline" size="sm" nativeButton={false} className="shrink-0" render={<Link href={categoryHref(category.id)} scroll={false} aria-label={`Show all ${category.name.toLowerCase()}, ${category.count} products`} />}>
                  Show all
                  <span className="text-muted-foreground tabular-nums">{category.count.toLocaleString('en-GB')}</span>
                </Button>
              </div>
              <ProductGrid>
                <CategoryRow label={category.name} products>
                  {items.map((item, i) => (
                    <ShopCard key={item.id} item={item} filters={{}} eager={row === 0 && i < 5} inBag={(id) => inBag.has(id)} onToggleBag={toggleBag} />
                  ))}
                  {category.count > items.length && (
                    <div className="flex items-center justify-center">
                      <Button variant="outline" nativeButton={false} render={<Link href={categoryHref(category.id)} scroll={false} />}>
                        Show all
                        <IconArrowRight data-icon="inline-end" aria-hidden />
                      </Button>
                    </div>
                  )}
                </CategoryRow>
              </ProductGrid>
            </section>
          ))}
        </div>
      </ShopLayout>

      <FabricBagSheet items={bag} open={bagOpen} onOpenChange={setBagOpen} />
    </>
  )
}

/** The store: come in through the rows, choose a category, then filter by what's true of that category. */
export function ShopPage({ params }: { params: Params }) {
  const state = readParams(params)
  const drilledIn = state.category || state.q || state.price || state.sort !== 'featured' || Object.keys(state.filters).length > 0
  return drilledIn ? <ShopBrowse state={state} /> : <ShopHome state={state} />
}

/** A category or a search, with the filters beside the products */
function ShopBrowse({ state }: { state: State }) {
  const router = useRouter()
  const { category, sub, q, filters, price, sort } = state
  const { bag, bagOpen, setBagOpen, inBag, toggleBag } = useShopBag()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const key = queryString(state)
  const [page, setPage] = useState({ key, n: 1 })
  const pageNumber = page.key === key ? page.n : 1
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`/api/shop?${key}${key ? '&' : ''}page=${pageNumber}`, { signal: AbortSignal.any([ctrl.signal, AbortSignal.timeout(30_000)]) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((response: ShopResponse) => {
        setFailed(null)
        setLoaded((old) => ({ key, response, items: pageNumber > 1 && old?.key === key ? [...old.items, ...response.items] : response.items }))
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return
        console.warn(e)
        setFailed(key)
      })
    return () => ctrl.abort()
  }, [key, pageNumber, attempt])

  const go = (next: Partial<State>) => router.replace(hrefFor({ ...state, ...next }), { scroll: false })
  const choose = (id: FacetId, values: string[]) => {
    const nextFilters = { ...filters }
    if (values.length) nextFilters[id] = values
    else delete nextFilters[id]
    go({ filters: nextFilters })
  }
  const clearAll = () => go({ filters: {}, price: null })

  const response = loaded?.response
  const busy = loaded?.key !== key || loaded.items.length < Math.min(pageNumber * (response?.pageSize ?? 0), response?.total ?? 0)
  const chosenCount = Object.values(filters).reduce((n, v) => n + (v?.length ?? 0), 0) + (price ? 1 : 0)
  const priceLabel = category?.id === 'fabric' ? 'Price per metre' : 'Price'

  const tags: FilterTag[] = [
    ...(Object.entries(filters) as [FacetId, string[]][]).flatMap(([id, values]) =>
      values.map((value) => ({
        id: `${id}:${value}`,
        label: value,
        swatch: id === 'colour' ? colourSwatch(value) : undefined,
        onRemove: () => choose(id, values.filter((v) => v !== value)),
      })),
    ),
    ...(price ? [{ id: 'price', label: `€${price.min}–€${price.max}`, onRemove: () => go({ price: null }) }] : []),
  ]

  const sortAndFilters = (
    <>
      <Select items={SORTS} value={sort} onValueChange={(v) => go({ sort: v as ShopSort })}>
        <SelectTrigger aria-label="Sort" className="w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {response && (
        <ShopFilters facets={response.facets} chosen={filters} onChoose={choose} price={response.price} priceValue={price} priceLabel={priceLabel} onPrice={(p) => go({ price: p })} />
      )}
    </>
  )

  return (
    <>
      <ShopLayout
        title={sub ? subLabel(category, sub) : category?.name ?? (q ? `“${q}”` : 'Shop')}
        breadcrumbs={
          category
            ? [{ label: 'Shop', href: '/fabric' }, ...(sub ? [{ label: category.name, href: categoryHref(category.id) }, { label: subLabel(category, sub) }] : [{ label: category.name }])]
            : q
              ? [{ label: 'Shop', href: '/fabric' }, { label: `“${q}”` }]
              : undefined
        }
        nav={response && <CategoryBubbles response={response} state={state} />}
        actions={<FabricBagButton count={bag.length} onClick={() => setBagOpen(true)} />}
        panelLabel="Filters"
        panelMeta={response ? response.total.toLocaleString('en-GB') : undefined}
        panel={sortAndFilters}
        search={<ShopSearch category={category} q={q} onSearch={(text) => go({ q: text })} />}
        sheetOpen={filtersOpen}
        onSheetOpenChange={setFiltersOpen}
        chosenCount={chosenCount}
        sheetFooter={
          <>
            <Button variant="outline" className="flex-1" disabled={chosenCount === 0} onClick={clearAll}>Clear</Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              Show {response?.total.toLocaleString('en-GB') ?? ''}
            </Button>
          </>
        }
      >
        <FilterTags tags={tags} onClear={clearAll} />

        {/* Nothing loaded yet, or a filter change didn't load: the results below would be the old ones */}
        {failed === key && (!response || loaded?.key !== key) && (
          <StatusMessage
            status="error"
            title={response ? 'These results didn’t load' : 'We couldn’t open the shop'}
            action={
              <Button variant="outline" size="sm" onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </Button>
            }
          >
            {response ? 'What you see below is from before your last change. ' : ''}Your bag is safe. This is usually a connection problem.
          </StatusMessage>
        )}

        {!response && !failed && <Skeletons />}

        {response &&
          (loaded.items.length === 0 && !busy ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconZoomQuestion />
                </EmptyMedia>
                <EmptyTitle>Nothing matches</EmptyTitle>
                <EmptyDescription>{chosenCount > 0 ? 'Remove a filter to see more.' : 'Try another word.'}</EmptyDescription>
              </EmptyHeader>
              {chosenCount > 0 && (
                <EmptyContent>
                  <Button variant="outline" onClick={clearAll}>Clear filters</Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <ProductGrid className="shop-results" aria-busy={busy}>
              <div className="shop-scroll">
                <div className="tiles">
                  {loaded.items.map((item, i) => (
                    <ShopCard key={item.id} item={item} filters={filters} eager={i < 6} inBag={(id) => inBag.has(id)} onToggleBag={toggleBag} />
                  ))}
                </div>
                <div className="flex flex-col items-center gap-3 p-3">
                  {/* More didn't load: say so where they would have appeared, with a way to ask again */}
                  {failed === key && loaded.key === key && pageNumber > 1 && (
                    <p className="text-center text-sm text-muted-foreground">The next products didn’t load. This is usually a connection problem.</p>
                  )}
                  {failed === key && loaded.key === key && pageNumber > 1 ? (
                    <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>Try again</Button>
                  ) : loaded.items.length < response.total && (
                    <Button variant="outline" disabled={busy} onClick={() => setPage({ key, n: pageNumber + 1 })}>
                      Show {Math.min(response.pageSize, response.total - loaded.items.length)} more
                      <span className="text-muted-foreground tabular-nums">· {loaded.items.length} of {response.total}</span>
                    </Button>
                  )}
                  {category?.id === 'fabric' && (
                    <p className="w-full text-xs text-muted-foreground">
                      Secondhand in Sweden:{' '}
                      {marketplaces.map((m, i) => (
                        <span key={m.id}>
                          {i > 0 && ' · '}
                          <a href={m.searchUrl(q ? `${q} tyg` : 'tyg')} target="_blank" rel="noopener" className="text-foreground underline underline-offset-4 hover:no-underline">
                            {m.name}
                          </a>
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="w-full text-xs text-muted-foreground">
                    You buy from the shop itself. Prices are checked daily, and the shop’s checkout shows the final price. Some shops may pay Sigrid a commission, which never changes your price.
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
