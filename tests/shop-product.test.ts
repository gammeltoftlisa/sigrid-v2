import { describe, expect, it } from 'vitest'

import { handleOf, productHref } from '@/lib/shop/href'
import { readDescription } from '@/lib/shop/product'

describe('product links', () => {
  it('reads the handle from a shop link with referral parameters', () => {
    expect(handleOf('https://merchantandmills.com/products/linen-blue?utm_source=sigrid')).toBe('linen-blue')
    expect(handleOf('https://www.atelierbrunette.com/en/products/jersey-off-white')).toBe('jersey-off-white')
    expect(handleOf('https://www.etsy.com/listing/123')).toBeNull()
  })

  it('links to the product page, with the chosen variant', () => {
    expect(productHref({ sourceId: 'raystitch', url: 'https://www.raystitch.co.uk/products/zip-20cm' }, 42)).toBe('/fabric/raystitch/zip-20cm?variant=42')
    expect(productHref({ sourceId: 'ebay', url: 'https://www.ebay.com/itm/1' })).toBeNull()
  })
})

describe('the shop’s description', () => {
  it('keeps text, lists and facts, and drops every tag', () => {
    const { about, facts } = readDescription(
      '<p>A soft, washed linen.<script>alert(1)</script></p><ul><li>Composition: 100% Linen</li><li>Machine wash at 30°</li><li>Pre-washed</li></ul><p>Width: 140 cm<br>Weight: 185 gsm</p><p>Lovely for shirts &amp; dresses.</p>',
    )
    expect(about).toEqual([
      { kind: 'p', text: 'A soft, washed linen.' },
      { kind: 'list', items: ['Machine wash at 30°', 'Pre-washed'] },
      { kind: 'p', text: 'Lovely for shirts & dresses.' },
    ])
    expect(facts).toEqual([
      { label: 'Composition', value: '100% Linen' },
      { label: 'Width', value: '140 cm' },
      { label: 'Weight', value: '185 gsm' },
    ])
  })

  it('doesn’t read a sentence with a colon as a fact', () => {
    const { about, facts } = readDescription('<p>Our tip for beginners: press every seam as you go.</p>')
    expect(facts).toEqual([])
    expect(about).toHaveLength(1)
  })
})

describe('the shop’s own page furniture', () => {
  it('is left out', () => {
    const { about } = readDescription('<p>Specifications:</p><p>Please select a size from the dropdown menu below.</p><p>Sold per single button.</p>')
    expect(about).toEqual([{ kind: 'p', text: 'Sold per single button.' }])
  })
})
