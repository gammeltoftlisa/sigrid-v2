'use client'

import { useEffect, useState } from 'react'

import { loadPattern, savePattern, withDerived, type StudioPattern } from './patterns'

/**
 * One studio pattern, loaded from this browser and saved on every change.
 * Any change after it was marked ready puts it back to draft, so nothing unchecked goes out.
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

  const change = (patch: Partial<StudioPattern>) =>
    setPattern((p) => (p ? withDerived({ ...p, ...patch, status: patch.status ?? 'draft', updatedAt: Date.now() }) : p))

  return { pattern, missing, change }
}
