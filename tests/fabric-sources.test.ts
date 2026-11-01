import { afterEach, describe, expect, it, vi } from 'vitest'

import { safeListing } from '@/lib/fabric/safe-listing'
import { cacheControlFor, searchAllSources } from '@/lib/fabric/sources'
import { searchShopify, shopifyShops } from '@/lib/fabric/sources/shopify'
import type { FabricListing, FabricQuery, SourceStatus } from '@/lib/fabric/types'

const query: FabricQuery = { q: 'linen', match: ['linen'], limit: 8, kind: 'fabric' }
const shop = shopifyShops[0]
const soon = () => Date.now() + 5000
const product = (handle: string) => ({ id: handle.length, title: `Linen ${handle}`, handle, available: true, tags: [] })
const variants = { product: { variants: [{ id: 1, title: '10 cm', price: '2.40' }] } }

function route(handler: (url: string) => Response) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => handler(url)))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchShopify', () => {
  const suggest = (products: unknown[]) => new Response(JSON.stringify({ resources: { results: { products } } }))

  it('one failing product does not cost the rest of the shop', async () => {
    route((url) => {
      if (url.includes('suggest')) return suggest([product('a'), product('bb')])
      return url.includes('/a.json') ? new Response('', { status: 404 }) : new Response(JSON.stringify(variants))
    })
    const { listings, incomplete } = await searchShopify(shop, query, soon())
    expect(listings.map((l) => l.title)).toEqual(['Linen bb'])
    expect(incomplete).toBe(true)
  })

  it('skips a malformed product and keeps the rest', async () => {
    route((url) => (url.includes('suggest') ? suggest([{ title: 'no id' }, product('bb')]) : new Response(JSON.stringify(variants))))
    const answer = await searchShopify(shop, query, soon())
    expect(answer.listings).toHaveLength(1)
    expect(answer.incomplete).toBe(false)
  })

  it('every product failing is a failure, not "no such fabric"', async () => {
    route((url) => (url.includes('suggest') ? suggest([product('a')]) : new Response('', { status: 404 })))
    await expect(searchShopify(shop, query, soon())).rejects.toMatchObject({ status: 404 })
  })
})

describe('searchAllSources', () => {
  it('marks a block page as failed, without calling it slow', async () => {
    route(() => new Response('<html>blocked</html>'))
    const { sources } = await searchAllSources(query)
    const m = sources.find((s) => s.id === shop.id)!
    expect(m).toMatchObject({ ok: false, failed: true, note: 'Couldn’t be reached' })
  })

  it('a source without keys is skipped, not failed', async () => {
    route(() => new Response(JSON.stringify({})))
    const { sources } = await searchAllSources(query)
    const ebay = sources.find((s) => s.id === 'ebay')!
    expect(ebay.ok).toBe(false)
    expect(ebay.failed).toBeUndefined()
  })
})

describe('cacheControlFor', () => {
  const base = { id: 'a', name: 'A', kind: 'shop' as const, count: 0 }
  const ok: SourceStatus = { ...base, ok: true }
  const failed: SourceStatus = { ...base, ok: false, failed: true }
  const skipped: SourceStatus = { ...base, ok: false, note: 'Needs keys' }

  it('keeps a full answer for half an hour', () => {
    expect(cacheControlFor([ok, skipped])).toContain('s-maxage=1800')
  })
  it('keeps a partial answer briefly', () => {
    expect(cacheControlFor([ok, failed])).toBe('public, s-maxage=60')
  })
  it('keeps a shop with missing products briefly, so the next search can fill them in', () => {
    expect(cacheControlFor([{ ...ok, incomplete: true }])).toBe('public, s-maxage=60')
  })
  it('does not keep an answer when nobody replied', () => {
    expect(cacheControlFor([failed, skipped])).toBe('no-store')
  })
})

describe('safeListing', () => {
  const listing = { id: 'x', title: 'Linen', url: 'https://shop.test/a', currency: 'GBP', unitPrice: 2.4 } as FabricListing

  it('keeps a good listing', () => {
    expect(safeListing(listing)).not.toBeNull()
  })
  it.each([
    ['a price that is not a number', { unitPrice: NaN }],
    ['no price', { unitPrice: 0 }],
    ['an empty title', { title: ' ' }],
    ['a strange currency', { currency: 'pounds' }],
    ['a link that is not https', { url: 'javascript:alert(1)' }],
  ])('turns away %s', (_, change) => {
    expect(safeListing({ ...listing, ...change })).toBeNull()
  })
})
