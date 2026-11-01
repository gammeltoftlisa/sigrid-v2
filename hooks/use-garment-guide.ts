'use client'

import { useCallback, useEffect, useState } from 'react'

import { unpackGuide, type WireGuide } from '@/lib/guide-wire'
import { findPublishedGuide, isPublishedId } from '@/lib/published'
import type { GarmentGuide } from '@/lib/types'

/** ready: here it is. none: not written yet. locked: not bought. error: couldn't be fetched, try again. */
export type GuideState = 'loading' | 'ready' | 'none' | 'locked' | 'error'

interface Result {
  key: string
  state: GuideState
  guide: GarmentGuide | null
}

const TIMEOUT_MS = 15_000

/** A garment's full guide. Sigrid's own come from the server, which checks the purchase; published ones live in this browser. */
export function useGarmentGuide(id: string) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const key = `${id}/${attempt}`

  useEffect(() => {
    if (isPublishedId(id)) {
      const guide = findPublishedGuide(id)
      // Published guides are in localStorage, which can only be read after hydration
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult({ key, state: guide ? 'ready' : 'none', guide })
      return
    }
    const ctrl = new AbortController()
    fetch(`/api/garments/${encodeURIComponent(id)}/guide`, { signal: AbortSignal.any([ctrl.signal, AbortSignal.timeout(TIMEOUT_MS)]) })
      .then(async (res) => {
        if (res.status === 404) return setResult({ key, state: 'none', guide: null })
        if (res.status === 401 || res.status === 403) return setResult({ key, state: 'locked', guide: null })
        if (!res.ok) throw new Error(String(res.status))
        const wire = (await res.json()) as WireGuide
        if (!Array.isArray(wire?.steps) || !Array.isArray(wire?.pieces)) throw new Error('Unexpected answer')
        setResult({ key, state: 'ready', guide: unpackGuide(wire) })
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return
        console.warn(e)
        setResult({ key, state: 'error', guide: null })
      })
    return () => ctrl.abort()
  }, [id, key])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const current = result?.key === key ? result : null
  return { guide: current?.guide ?? null, state: current?.state ?? ('loading' as GuideState), retry }
}
