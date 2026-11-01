import type { z } from 'zod'

/**
 * Everything Sigrid keeps in this browser goes through here, so that three things always hold:
 * unreadable data is never mistaken for "nothing saved", a failed save is never silent, and
 * nothing is overwritten before it has been read. Every key starts with `sigrid_`, which is what
 * "Delete my data" on the profile page removes.
 */

export type WriteResult = { ok: true } | { ok: false; reason: 'full' | 'unavailable' }

export type ReadResult<T> =
  | { status: 'empty' }
  | { status: 'ok'; value: T }
  /** Something is saved but can't be read. A copy was kept under corruptCopyKey(key). */
  | { status: 'corrupt'; raw: string }

export const STORAGE_PROBLEM_EVENT = 'sigrid-storage-problem'
export type StorageProblem = 'full' | 'unavailable' | 'unreadable'

/** Tells the app-wide listener (components/storage-alerts.tsx). Deferred because reads happen during render. */
export function announceStorageProblem(problem: StorageProblem) {
  if (typeof window === 'undefined') return
  queueMicrotask(() => window.dispatchEvent(new CustomEvent<StorageProblem>(STORAGE_PROBLEM_EVENT, { detail: problem })))
}

export function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const isQuotaError = (e: unknown) => {
  const name = (e as { name?: string } | null)?.name
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED'
}

/** Saves a value without announcing a failure; for steps that can still recover (migration, copies) */
export function tryWriteRaw(key: string, value: string): WriteResult {
  try {
    localStorage.setItem(key, value)
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: isQuotaError(e) ? 'full' : 'unavailable' }
  }
}

export function writeRaw(key: string, value: string): WriteResult {
  const result = tryWriteRaw(key, value)
  if (!result.ok) announceStorageProblem(result.reason)
  return result
}

export function removeRaw(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {}
}

export function storedKeys(prefix: string): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) keys.push(key)
    }
    return keys
  } catch {
    return []
  }
}

export const corruptCopyKey = (key: string) => `sigrid_corrupt_${key.replace(/^sigrid_/, '')}`

/** Keeps the first unreadable version of a key, so it can still be rescued. False when there was no room. */
export function keepCorruptCopy(key: string, raw: string): boolean {
  const copy = corruptCopyKey(key)
  if (readRaw(copy) !== null) return true
  return tryWriteRaw(copy, raw).ok
}

/** Parses a saved value. Anything unreadable is copied aside and reported rather than treated as empty. */
export function parseStored<S extends z.ZodType>(key: string, raw: string | null, schema: S): ReadResult<z.output<S>> {
  if (raw === null) return { status: 'empty' }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return corrupt(key, raw)
  }
  const parsed = schema.safeParse(json)
  return parsed.success ? { status: 'ok', value: parsed.data } : corrupt(key, raw)
}

function corrupt(key: string, raw: string): { status: 'corrupt'; raw: string } {
  keepCorruptCopy(key, raw)
  announceStorageProblem('unreadable')
  return { status: 'corrupt', raw }
}

export const readJson = <S extends z.ZodType>(key: string, schema: S): ReadResult<z.output<S>> => parseStored(key, readRaw(key), schema)

/** Keeps the entries of a saved list that are valid. One bad entry shouldn't cost the rest. */
export function validEntries<S extends z.ZodType>(items: unknown[], schema: S): z.output<S>[] {
  const out: z.output<S>[] = []
  for (const item of items) {
    const parsed = schema.safeParse(item)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}
