import { beforeEach, describe, expect, it } from 'vitest'

import { loadActivity, logStepDone } from '@/lib/activity'
import { groupBag, type BagItem } from '@/lib/fabric/bag'
import { corruptCopyKey } from '@/lib/local-store'
import { loadProject, saveProject } from '@/lib/projects'

import { installFakeStorage } from './fake-storage'

beforeEach(() => {
  installFakeStorage()
})

describe('projects', () => {
  it('reads back what was saved', () => {
    saveProject('a', { size: 'M', completedUntil: 3 })
    expect(loadProject('a')).toMatchObject({ size: 'M', completedUntil: 3 })
  })

  it('saving without a change does not count as newer, so another device keeps its progress', () => {
    localStorage.setItem('sigrid_project_a', JSON.stringify({ size: 'M', completedUntil: 3, updatedAt: '2026-01-01T00:00:00.000Z' }))
    saveProject('a', { size: 'M', completedUntil: 3 })
    expect(loadProject('a')?.updatedAt).toBe('2026-01-01T00:00:00.000Z')
    saveProject('a', { size: 'M', completedUntil: 4 })
    expect(loadProject('a')?.updatedAt).not.toBe('2026-01-01T00:00:00.000Z')
  })

  it.each([['{"size":"HUGE","completedUntil":1}'], ['{"size":"M","completedUntil":-1}'], ['nope']])('turns away %s and keeps a copy', (raw) => {
    localStorage.setItem('sigrid_project_a', raw)
    expect(loadProject('a')).toBeNull()
    expect(localStorage.getItem(corruptCopyKey('sigrid_project_a'))).toBe(raw)
  })
})

describe('activity', () => {
  it('keeps the good entries when one is bad', () => {
    localStorage.setItem('sigrid_activity', JSON.stringify([{ garmentId: 'a', step: 1, action: 'sew', at: '2026-10-31T10:00:00Z' }, { at: 12 }, null]))
    expect(loadActivity()).toHaveLength(1)
  })

  it('logging a step twice counts it once', () => {
    logStepDone({ garmentId: 'a', step: 1, action: 'sew' })
    logStepDone({ garmentId: 'a', step: 1, action: 'sew' })
    expect(loadActivity()).toHaveLength(1)
  })
})

describe('the bag', () => {
  const item = (id: string, currency: string, unitPrice: number, units = 1): BagItem =>
    ({
      units,
      garmentId: 'g',
      listing: { id, sourceId: 'etsy', sourceName: 'Etsy', title: id, url: 'https://etsy.com/x', currency, unitPrice, checkout: { kind: 'link' } },
    }) as BagItem

  it('never adds different currencies into one total', () => {
    const groups = groupBag([item('a', 'GBP', 10), item('b', 'EUR', 20), item('c', 'GBP', 5, 2)])
    expect(groups.map((g) => [g.currency, g.total])).toEqual([
      ['GBP', 20],
      ['EUR', 20],
    ])
    expect(new Set(groups.map((g) => g.key)).size).toBe(2)
  })
})
