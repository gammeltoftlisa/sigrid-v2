'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

import { paymentsEnabled } from '@/lib/payments'

/** The patterns the logged-in user owns. `loading` stays true until that's known. */
export function usePurchases() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const [result, setResult] = useState<{ userId: string; garmentIds: string[] } | null>(null)

  const refresh = useCallback(async () => {
    if (!paymentsEnabled || !userId) return
    const res = await fetch('/api/purchases', { cache: 'no-store' })
    if (!res.ok) throw new Error('Could not read purchases')
    const { garmentIds } = (await res.json()) as { garmentIds: string[] }
    setResult({ userId, garmentIds })
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch(() => {})
  }, [refresh])

  const current = result?.userId === userId ? result : null
  return {
    isSignedIn: !!isSignedIn,
    garmentIds: current?.garmentIds ?? [],
    loading: paymentsEnabled && (!isLoaded || (!!isSignedIn && !current)),
    refresh,
  }
}
