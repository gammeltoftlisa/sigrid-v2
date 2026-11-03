import { beforeEach, describe, expect, it } from 'vitest'

import { corruptCopyKey } from '@/lib/local-store'
import { createPattern, deletePattern, loadPattern, loadPatterns, MAX_PHOTOS, patternKey, photoKey, savePattern, setPhotos, type StudioPattern } from '@/lib/studio/patterns'

import { installFakeStorage } from './fake-storage'

const LEGACY = 'sigrid_studio_patterns'
const legacyItem = (id: string, extra: object = {}) => ({ id, name: id, updatedAt: 1, ...extra })

describe('moving the old all-in-one list', () => {
  let storage: ReturnType<typeof installFakeStorage>
  beforeEach(() => {
    storage = installFakeStorage()
  })

  it('moves every pattern to its own key and removes the old list', () => {
    storage.setItem(LEGACY, JSON.stringify([legacyItem('pb'), legacyItem('pa', { photo: 'data:photo' })]))
    expect(loadPatterns().map((p) => p.id)).toEqual(['pb', 'pa'])
    expect(storage.getItem(LEGACY)).toBeNull()
    expect(storage.getItem(photoKey('pa'))).toBe('data:photo')
    expect(storage.getItem(patternKey('pa'))).not.toContain('data:photo')
    expect(loadPattern('pa')?.photo).toBe('data:photo')
  })

  it('keeps a list it cannot parse instead of treating it as empty', () => {
    storage.setItem(LEGACY, '{not json')
    expect(loadPatterns()).toEqual([])
    savePattern(createPattern())
    expect(storage.getItem(corruptCopyKey(LEGACY))).toBe('{not json')
  })

  it('keeps one unreadable pattern aside without losing the others', () => {
    storage.setItem(LEGACY, JSON.stringify([legacyItem('pa'), { id: 'bad', pieces: null }]))
    expect(loadPatterns().map((p) => p.id)).toEqual(['pa'])
    expect(storage.getItem(corruptCopyKey(LEGACY))).toContain('"bad"')
  })

  it('puts the old list back when there is no room to move it', () => {
    // Room for the old list, not for the extra key names of the new layout
    const raw = JSON.stringify([legacyItem('pa', { photo: 'x'.repeat(200) }), legacyItem('pb', { photo: 'y'.repeat(200) })])
    storage = installFakeStorage(raw.length + LEGACY.length)
    storage.setItem(LEGACY, raw)
    expect(loadPatterns().map((p) => p.id)).toEqual(['pb', 'pa'])
    expect(storage.getItem(LEGACY)).toBe(raw)
    expect(storage.getItem(patternKey('pa'))).toBeNull()
  })
})

describe('saving', () => {
  beforeEach(() => {
    installFakeStorage()
  })

  it('an unreadable pattern stays where it is and costs the others nothing', () => {
    const good = createPattern()
    localStorage.setItem(patternKey('pbroken'), '{not json')
    savePattern({ ...good, name: 'Edited' })
    expect(loadPatterns().map((p) => p.name)).toEqual(['Edited'])
    expect(localStorage.getItem(patternKey('pbroken'))).toBe('{not json')
  })

  it('reports when storage is full', () => {
    const p = createPattern()
    installFakeStorage(10)
    expect(savePattern(p)).toEqual({ ok: false, reason: 'full' })
  })

  it('a stale tab cannot overwrite a newer save', () => {
    const p = createPattern()
    savePattern({ ...p, name: 'Newer', updatedAt: p.updatedAt + 1000 })
    savePattern({ ...p, name: 'Stale', updatedAt: p.updatedAt + 1 })
    expect(loadPattern(p.id)?.name).toBe('Newer')
  })

  it('a tab still showing a deleted pattern cannot bring it back', () => {
    const p: StudioPattern = createPattern()
    deletePattern(p.id)
    savePattern({ ...p, updatedAt: p.updatedAt + 1000 })
    expect(loadPattern(p.id)).toBeNull()
  })

  it('removing a photo removes its key', () => {
    const p = createPattern()
    savePattern({ ...p, photo: 'data:photo', updatedAt: p.updatedAt + 1 })
    expect(localStorage.getItem(photoKey(p.id))).toBe('data:photo')
    savePattern({ ...p, photo: undefined, updatedAt: p.updatedAt + 2 })
    expect(localStorage.getItem(photoKey(p.id))).toBeNull()
  })

  it('keeps several photos in order, the first as the cover, and reads an old single photo', () => {
    const p = createPattern()
    savePattern({ ...p, ...setPhotos(['data:a', 'data:b', 'data:c']), updatedAt: p.updatedAt + 1 })
    expect(storageHasNoPhotos(p.id)).toBe(true)
    const back = loadPattern(p.id)!
    expect(back.photos).toEqual(['data:a', 'data:b', 'data:c'])
    expect(back.photo).toBe('data:a')
    localStorage.setItem(photoKey(p.id), 'data:old')
    expect(loadPattern(p.id)?.photos).toEqual(['data:old'])
  })

  it('keeps at most a few photos', () => {
    expect(setPhotos(Array.from({ length: MAX_PHOTOS + 3 }, (_, i) => `data:${i}`)).photos).toHaveLength(MAX_PHOTOS)
    expect(setPhotos([])).toEqual({ photo: undefined, photos: undefined })
  })
})

/** The photos live under their own key, never in the pattern's text */
const storageHasNoPhotos = (id: string) => !(localStorage.getItem(patternKey(id)) ?? '').includes('data:')
