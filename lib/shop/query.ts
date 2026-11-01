import { categories, colours, facetLabels, getCategory, MULTICOLOUR, universalFacets, type FacetId } from './taxonomy'
import { BUTTON_SIZES, FABRIC_WIDTHS, NARROW_WIDTHS, ZIP_LENGTHS } from './classify'
import type { CategorySummary, FacetOption, ShopFacet, ShopItem, ShopQuery, ShopResponse, ShopRowsResponse } from './types'

export const PAGE_SIZE = 48
/** How many products a category shows on the way into the store */
export const ROW_SIZE = 12

const LOGICAL_ORDER: Partial<Record<FacetId, string[]>> = {
  weight: ['Light', 'Medium', 'Heavy'],
  width: [...NARROW_WIDTHS, ...FABRIC_WIDTHS].map(([, name]) => name),
  length: ZIP_LENGTHS.map(([, name]) => name),
  size: BUTTON_SIZES.map(([, name]) => name),
  spool: ['Up to 50 m', '50–150 m', '150–500 m', 'Over 500 m'],
  colour: [...colours.map((c) => c.name), MULTICOLOUR],
}

const hexOf = (name: string): string | undefined => colours.find((c) => c.name === name)?.hex

/** Every word has to be in the name, the type or the shop */
function searchable(item: ShopItem): string {
  const f = item.facets
  return `${item.title} ${getCategory(item.category)?.name ?? ''} ${item.sub} ${f.type?.join(' ') ?? ''} ${f.material?.join(' ') ?? ''} ${f.brand?.join(' ') ?? ''} ${f.colour?.join(' ') ?? ''} ${item.sourceName}`.toLowerCase()
}

export const matchesSearch = (item: ShopItem, q: string) => {
  const hay = searchable(item)
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((word) => hay.includes(word) || hay.includes(word.replace(/s$/, '')))
}

/** Does it pass every filter, optionally ignoring one? Options within a filter are alternatives. */
function passes(item: ShopItem, query: ShopQuery, ignore?: FacetId | 'price'): boolean {
  for (const [id, wanted] of Object.entries(query.filters) as [FacetId, string[]][]) {
    if (id === ignore || !wanted?.length) continue
    const has = item.facets[id]
    if (!has || !wanted.some((w) => has.includes(w))) return false
  }
  if (ignore !== 'price' && query.price && (item.eur < query.price.min || item.eur > query.price.max + 0.999)) return false
  return true
}

/** The shops take turns, so the one with the most stock doesn't fill the first screen */
export function takeTurns<T>(lists: T[][]): T[] {
  const out: T[] = []
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length) out.push(l[i])
  return out
}

function featured(items: ShopItem[], byCategory: boolean): ShopItem[] {
  const groupBy = (list: ShopItem[], keyOf: (i: ShopItem) => string) => {
    const groups = new Map<string, ShopItem[]>()
    for (const i of list) groups.set(keyOf(i), [...(groups.get(keyOf(i)) ?? []), i])
    return [...groups.values()]
  }
  const byShop = (list: ShopItem[]) => takeTurns(groupBy([...list].sort((a, b) => a.rank - b.rank), (i) => i.sourceId))
  return byCategory ? takeTurns(categories.map((c) => byShop(items.filter((i) => i.category === c.id)))) : byShop(items)
}

function sorted(items: ShopItem[], query: ShopQuery): ShopItem[] {
  switch (query.sort) {
    case 'price-asc':
      return [...items].sort((a, b) => a.eur - b.eur)
    case 'price-desc':
      return [...items].sort((a, b) => b.eur - a.eur)
    case 'newest':
      return [...items].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    default:
      return featured(items, !query.category)
  }
}

/** Options with how many results each would give alongside the other filters. A chosen one always stays. */
function facet(id: FacetId, pool: ShopItem[], query: ShopQuery): ShopFacet | null {
  const counts = new Map<string, number>()
  for (const item of pool) {
    if (!passes(item, query, id)) continue
    for (const v of item.facets[id] ?? []) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  const chosen = query.filters[id] ?? []
  for (const c of chosen) if (!counts.has(c)) counts.set(c, 0)
  const order = LOGICAL_ORDER[id]
  const options: FacetOption[] = [...counts]
    .map(([value, count]) => ({ value, count, ...(id === 'colour' ? { hex: hexOf(value) } : {}) }))
    .sort((a, b) => (order ? order.indexOf(a.value) - order.indexOf(b.value) : b.count - a.count || a.value.localeCompare(b.value)))
  // One option is no choice at all, unless saying it is the point of the filter ("Stretch", "Organic")
  const worthAsSingle = id === 'stretch' || id === 'eco'
  if (options.length < (worthAsSingle ? 1 : 2) && chosen.length === 0) return null
  return { id, label: facetLabels[id], options }
}

const categorySummaries = (all: ShopItem[]): CategorySummary[] => categories.map((c) => ({ id: c.id, name: c.short ?? c.name, count: all.filter((i) => i.category === c.id).length }))

/** The way into the store: each category that has products, with its first few, in the taxonomy's order */
export function queryShopRows(all: ShopItem[], refreshedAt: string | null = null): ShopRowsResponse {
  const summaries = categorySummaries(all)
  return {
    rows: summaries
      .filter((c) => c.count > 0)
      .map((category) => ({ category, items: featured(all.filter((i) => i.category === category.id), false).slice(0, ROW_SIZE) })),
    categories: summaries,
    refreshedAt,
  }
}

/** Everything a page of the store needs, from the whole catalogue */
export function queryShop(all: ShopItem[], query: ShopQuery, refreshedAt: string | null = null): ShopResponse {
  const category = query.category ? getCategory(query.category) : undefined
  const inCategory = category ? all.filter((i) => i.category === category.id) : all
  const inSub = category && query.sub ? inCategory.filter((i) => i.sub === query.sub) : inCategory
  const pool = query.q ? inSub.filter((i) => matchesSearch(i, query.q!)) : inSub

  const matching = pool.filter((i) => passes(i, query))
  const ordered = sorted(matching, query)
  const page = Math.max(1, query.page)

  const prices = pool.filter((i) => passes(i, query, 'price')).map((i) => i.eur)
  const ids: FacetId[] = [...(category?.facets ?? universalFacets), 'shop']

  return {
    items: ordered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: ordered.length,
    page,
    pageSize: PAGE_SIZE,
    facets: ids.map((id) => facet(id, pool, query)).filter((f): f is ShopFacet => f !== null),
    price: prices.length ? { min: Math.floor(Math.min(...prices)), max: Math.max(Math.ceil(Math.max(...prices)), Math.floor(Math.min(...prices)) + 1) } : null,
    categories: categorySummaries(all),
    subs: (category?.subs ?? []).map((sub) => ({ name: sub.name, count: inCategory.filter((i) => i.sub === sub.name).length })).filter((sub) => sub.count > 0),
    refreshedAt,
  }
}
