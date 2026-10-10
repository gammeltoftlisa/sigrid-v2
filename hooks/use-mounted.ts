'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** False during server render and hydration, true after. Use before reading localStorage or the clock. */
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
