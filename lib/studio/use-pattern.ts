'use client'

import { useEffect, useState } from 'react'

import { loadPattern, patternKey, photoKey, savePattern, withDerived, type StudioPattern } from './patterns'

/**
 * One studio pattern, loaded from this browser and saved on every change.
 * Any change after it was marked ready puts it back to draft, so nothing unchecked goes out.
 * It follows other tabs: a newer save there shows up here, and a deletion there closes it here.
 */
export function useStudioPattern(id: string) {
  const [pattern, setPattern] = useState<StudioPattern | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const p = loadPattern(id)
    // Patterns live in localStorage, which can only be read after hydration
    /* eslint-disable react-hooks/set-state-in-effect */
    if (p) setPattern(p)
    else setMissing(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id])

  useEffect(() => {
    if (pattern) savePattern(pattern)
  }, [pattern])

  // `storage` only fires for changes made in other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== patternKey(id) && e.key !== photoKey(id)) return
      const fresh = loadPattern(id)
      if (!fresh) {
        setPattern(null)
        setMissing(true)
        return
      }
      setPattern((current) => (current && current.updatedAt >= fresh.updatedAt && (current.photos ?? []).join() === (fresh.photos ?? []).join() ? current : fresh))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [id])

  const change = (patch: Partial<StudioPattern>) =>
    setPattern((p) => (p ? withDerived({ ...p, ...patch, status: patch.status ?? 'draft', updatedAt: Date.now() }) : p))

  return { pattern, missing, change }
}
