import { describe, expect, it } from 'vitest'

import { catalogGarments, getGuideOutline } from '@/lib/data'
import { departmentGroups, departments, supplyFor } from '@/lib/fabric/catalog'
import { suppliesFor } from '@/lib/fabric/supplies'

describe('the shop', () => {
  it('every department belongs to a group that is shown', () => {
    for (const d of departments) expect(departmentGroups, d.id).toContain(d.group)
    expect(new Set(departments.map((d) => d.id)).size).toBe(departments.length)
  })
  it('has the supplies, not only fabric', () => {
    for (const id of ['thread', 'needles', 'pins', 'zips', 'buttons', 'elastic', 'interfacing', 'scissors', 'marking', 'unpicking']) expect(departments.map((d) => d.id)).toContain(id)
  })
  it('a search for a supply looks in the supplies, a fabric search in the fabric', () => {
    expect(supplyFor('elastic')?.id).toBe('elastic')
    expect(supplyFor('black zip')?.id).toBe('zips')
    expect(supplyFor('tape measure')?.id).toBe('measuring')
    expect(supplyFor('washed linen')).toBeUndefined()
    expect(supplyFor('needlecord')).toBeUndefined()
  })
})

describe('what you’ll need', () => {
  it('every pattern has a list, with the basics', () => {
    for (const g of catalogGarments) {
      const list = suppliesFor(g.id)
      expect(list.basics.map((s) => s.id), g.id).toContain('thread')
      const ids = [...list.special, ...list.basics].map((s) => s.id)
      expect(new Set(ids).size, g.id).toBe(ids.length)
    }
  })
  it('only patterns with a guide say their list is complete', () => {
    for (const g of catalogGarments) expect(suppliesFor(g.id).complete, g.id).toBe(!!getGuideOutline(g.id)?.steps.length)
  })
  it('lists what the guides ask for', () => {
    expect(suppliesFor('cap-sleeve-button-top').special.map((s) => s.name)).toContain('4 small shank buttons')
    expect(suppliesFor('lace-waist-skirt').special.map((s) => s.name)).toContain('20 cm invisible zip')
  })
  it('every search finds its department, so it looks in the supplies', () => {
    for (const g of catalogGarments) for (const s of [...suppliesFor(g.id).special, ...suppliesFor(g.id).basics]) if (s.search) expect(supplyFor(s.search), s.search).toBeTruthy()
  })
})
