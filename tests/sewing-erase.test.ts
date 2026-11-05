import { PGlite } from '@electric-sql/pglite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setSqlForTests } from '@/lib/db'
import { eraseSewing, mergeSewing, readState } from '@/lib/sewing-db'
import type { SewingState } from '@/lib/sewing-types'

import { applyMigrations } from './migrations'
import { pgliteSql } from './pglite-sql'

let pg: PGlite
beforeEach(async () => {
  pg = new PGlite()
  await applyMigrations(pg)
  setSqlForTests(pgliteSql(pg))
})
afterEach(async () => {
  setSqlForTests(null)
  await pg.close()
})

const at = (msAgo: number) => new Date(Date.now() - msAgo).toISOString()
const state = (updatedAt: string): SewingState => ({
  projects: [{ garmentId: 'lace-waist-skirt', size: 'M', completedUntil: 4, updatedAt }],
  activity: [{ garmentId: 'lace-waist-skirt', step: 3, action: 'sew', at: updatedAt }],
  size: { size: 'M', updatedAt },
})

describe('deleting my sewing data', () => {
  it('deletes everything, and another device cannot bring it back', async () => {
    await mergeSewing('user_a', state(at(60_000)))
    await eraseSewing('user_a')
    // A phone that was offline syncs what it had from before the erase
    const after = await mergeSewing('user_a', state(at(60_000)))
    expect(after.projects).toEqual([])
    expect(after.activity).toEqual([])
    expect(after.size).toBeNull()
  })

  it('keeps what was done after the erase', async () => {
    await mergeSewing('user_a', state(at(60_000)))
    await eraseSewing('user_a')
    await new Promise((r) => setTimeout(r, 5))
    const after = await mergeSewing('user_a', state(at(0)))
    expect(after.projects).toHaveLength(1)
    expect(after.activity).toHaveLength(1)
  })

  it('a sync and an erase at the same moment never leave old data behind', async () => {
    await mergeSewing('user_a', state(at(60_000)))
    await Promise.all([mergeSewing('user_a', state(at(30_000))), eraseSewing('user_a')])
    const { projects, activity } = await readState('user_a')
    const { rows } = await pg.query<{ erased_at: string }>('SELECT erased_at FROM sewing_profiles')
    const erasedAt = new Date(rows[0].erased_at).getTime()
    // Whatever order they ran in, nothing older than the erase survives it
    for (const p of projects) expect(new Date(p.updatedAt).getTime()).toBeGreaterThan(erasedAt)
    for (const s of activity) expect(new Date(s.at).getTime()).toBeGreaterThan(erasedAt)
  })
})
