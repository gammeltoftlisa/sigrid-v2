import { describe, expect, it } from 'vitest'

import { shopifyShops } from '@/lib/fabric/sources/shopify'
import { categoryOf, classify, coloursIn, subOf, type RawProduct } from '@/lib/shop/classify'
import { curate } from '@/lib/shop/curate'
import { toShopItem } from '@/lib/shop/item'
import { queryShop, queryShopRows, ROW_SIZE } from '@/lib/shop/query'
import { categories } from '@/lib/shop/taxonomy'
import type { ShopItem, ShopQuery } from '@/lib/shop/types'

const product = (title: string, more: Partial<RawProduct> = {}): RawProduct => ({
  id: title,
  title,
  handle: title.toLowerCase().replace(/\W+/g, '-'),
  variants: [{ id: 1, title: 'Default Title', price: '3.00', available: true }],
  images: [{ src: 'https://cdn.shopify.com/x.jpg' }],
  ...more,
})

// Real products the first version got wrong
describe('what kind of thing a product is', () => {
  it.each([
    ['Needle Stripe Cotton Jersey - Cotton Candy', { product_type: 'Fabric' }, 'fabric'],
    ['Prym Schmetz Quick Thread Sewing Machine Needles - No 80', { product_type: 'Haberdashery' }, 'needles'],
    ['Sew All 441', { product_type: 'Tools & Notions', tags: ['Thread', 'Gutermann Sew All Thread 1 - 500'] }, 'thread'],
    ['Recycled Drawstring Ecru', { product_type: 'Fabric', tags: ['All Trims', 'Drawstring'] }, 'trims'],
    ['Midnight overlock bobbin x 4', { tags: ['mercerie'] }, 'thread'],
    ['Milward Tailors Clapper - Medium', { product_type: 'Haberdashery', tags: ['Measure', 'Clover'] }, 'tools'],
    ['Moorland 20mm', { product_type: 'Tools & Notions', tags: ['Buttons'] }, 'buttons'],
    ['Prym 390355 - Anorak Press Fasteners - Antique Brass 20mm', { product_type: 'Haberdashery' }, 'fasteners'],
  ] as [string, Partial<RawProduct>, string][])('%s', (title, more, expected) => {
    expect(categoryOf(product(title, more))).toBe(expected)
  })

  it.each([
    ['Lise Tailor Dress', { product_type: 'Sewing Pattern' }],
    ['REMNANT 0.30 metre - Blue Jersey', { product_type: 'Fabric' }],
    ['Overlocker Thread Hamper - 12 Large Cones (Lucky Dip)', { product_type: 'Haberdashery' }],
    ['Velvet Curtain', { product_type: 'Furnishing Fabric' }],
    ['Add a matching Gutermann MARAFLEX Elastic Sewing Thread', { product_type: 'Haberdashery' }],
  ] as [string, Partial<RawProduct>][])('leaves out %s', (title, more) => {
    expect(categoryOf(product(title, more))).toBeNull()
  })
})

describe('what a product says about itself', () => {
  it('colour words that are something else are not colours', () => {
    expect(coloursIn('Denim Thread')).toEqual([])
    expect(coloursIn('Peach Touch')).toEqual([])
    expect(coloursIn('Stone washed')).toEqual([])
    expect(coloursIn('Hunter Green 530')).toEqual(['Green'])
  })
  it('a zip is what its teeth are, not its pull', () => {
    const c = classify(product('Concealed Zip - Russet 855', { product_type: 'Zip', body_html: 'plastic teeth and metal shaped pull', options: [{ name: 'Size', values: ['20cm', '56cm'] }] }))
    expect(c?.facets.material).toEqual(['Plastic'])
    expect(c?.facets.length).toEqual(['20–30 cm', 'Over 50 cm'])
    expect(c?.facets.type).toEqual(['Invisible'])
  })
  it('the name beats the tags for the brand', () => {
    expect(classify(product('Milward Tailors Clapper', { tags: ['Clover'] }))?.facets.brand).toEqual(['Milward'])
  })
  it('fabric goes in a subcategory by how it’s made first', () => {
    expect(subOf('fabric', { material: ['Cotton'] }, 'Organic Cotton Jersey - Ivory')).toBe('Jersey and knits')
    expect(subOf('fabric', { material: ['Linen'] }, 'European Washed Linen - White')).toBe('Linen')
    expect(subOf('fabric', {}, 'La Rayure 002')).toBeNull()
  })
  it('a colour or a tag doesn’t put cloth in the wrong subcategory', () => {
    expect(subOf('fabric', { type: ['Denim and chambray'], material: ['Wool'] }, 'Lightweight Worsted Wool - Denim Blues')).not.toBe('Denim')
    expect(classify(product('Seriously Silky Twill', { product_type: 'Fabric' }))?.facets.material).toBeUndefined()
  })
})

const shop = shopifyShops[0]
const item = (title: string, more: Partial<RawProduct> = {}, rank = 0) => toShopItem(shop, product(title, more), rank)!

describe('the taxonomy', () => {
  it('a filter that names the subcategory isn’t a filter too', () => {
    for (const c of categories) if (c.subFacet) expect(c.facets, c.id).not.toContain(c.subFacet)
  })
  it('carries about 150 things, if the shops have them', () => {
    const total = categories.flatMap((c) => c.subs).reduce((n, s) => n + s.quota, 0)
    expect(total).toBeGreaterThan(130)
    expect(total).toBeLessThan(180)
  })
})

describe('choosing what the store carries', () => {
  const zips = ['Concealed Zip - Red', 'Concealed Zip - Blue', 'Concealed Zip - Green', 'Concealed Zip - Pink', 'Concealed Zip - Black', 'YKK Invisible Dress Zip - Grey'].map((t, i) => item(t, { id: i + 1, product_type: 'Zip' }))
  it('keeps to the quota, and doesn’t pick the same thing twice while there’s something else', () => {
    const chosen = curate(zips)
    expect(chosen).toHaveLength(4)
    expect(chosen.map((z) => z.title)).toContain('YKK Invisible Dress Zip - Grey')
    expect(new Set(chosen.flatMap((z) => z.facets.colour)).size).toBe(4)
  })
  it('gives the same answer every time', () => {
    expect(curate(zips).map((z) => z.id)).toEqual(curate([...zips].reverse()).map((z) => z.id))
  })
})

describe('the store', () => {
  const all: ShopItem[] = [
    item('Concealed Zip - Red', { id: 1, product_type: 'Zip', options: [{ name: 'Size', values: ['20cm'] }] }),
    item('Open-Ended Zip - Blue', { id: 2, product_type: 'Zip', options: [{ name: 'Size', values: ['56cm'] }] }),
    item('Sewing Thread - Blue', { id: 3, product_type: 'Thread' }),
    item('European Linen - Blue', { id: 4, product_type: 'Fabric', body_html: '100% linen' }),
  ]
  const ask = (q: Partial<ShopQuery>) => queryShop(all, { filters: {}, sort: 'featured', page: 1, ...q })

  it('opens with a row for each category that has products, each with only its own', () => {
    const { rows } = queryShopRows(all)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.map((r) => r.category.id)).toEqual(categories.filter((c) => all.some((i) => i.category === c.id)).map((c) => c.id))
    for (const row of rows) {
      expect(row.items.length).toBeLessThanOrEqual(ROW_SIZE)
      expect(row.items.length).toBeGreaterThan(0)
      expect(row.items.every((i) => i.category === row.category.id)).toBe(true)
      expect(row.category.count).toBe(all.filter((i) => i.category === row.category.id).length)
    }
  })

  it('at the top, only universal filters', () => {
    expect(ask({}).facets.map((f) => f.id)).toEqual(['colour'])
    expect(ask({}).subs).toEqual([])
  })
  it('in a category, its own filters and its subcategories', () => {
    const r = ask({ category: 'zips' })
    expect(r.total).toBe(2)
    expect(r.facets.map((f) => f.id)).toContain('colour')
    expect(r.facets.map((f) => f.id)).toContain('length')
    expect(r.facets.map((f) => f.id)).not.toContain('pattern')
    expect(r.subs.map((s) => s.name)).toEqual(['Invisible', 'Open-ended'])
  })
  it('a subcategory narrows, and keeps the category’s other subcategories to go to', () => {
    const r = ask({ category: 'zips', sub: 'Invisible' })
    expect(r.total).toBe(1)
    expect(r.subs).toHaveLength(2)
  })
  it('a filter’s own count ignores itself, so you can add a second colour', () => {
    const r = ask({ category: 'zips', filters: { colour: ['Red'] } })
    expect(r.total).toBe(1)
    expect(r.facets.find((f) => f.id === 'colour')?.options.map((o) => o.value)).toEqual(['Red', 'Blue'])
  })
  it('search looks across categories', () => {
    expect(ask({ q: 'blue zip' }).total).toBe(1)
  })
})
