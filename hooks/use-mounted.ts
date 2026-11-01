'use client'

import { useSyncExternalStore } from 'react'

import { getSewingVersion, subscribeSewing } from '@/lib/sewing-store'

/**
 * False during server render and hydration, true after. Use before reading localStorage or the clock.
 * Also redraws the screen when another device's changes arrive in localStorage.
 */
export function useMounted() {
  return useSewingVersion() >= 0
}

/** Goes up when saved sewing changes from elsewhere: use it to re-read localStorage in an effect. -1 until mounted. */
export function useSewingVersion() {
  return useSyncExternalStore(subscribeSewing, getSewingVersion, () => -1)
}
