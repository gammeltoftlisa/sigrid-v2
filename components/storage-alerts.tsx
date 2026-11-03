'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

import { STORAGE_PROBLEM_EVENT, type StorageProblem } from '@/lib/local-store'

const MESSAGES: Record<StorageProblem, string> = {
  full: 'This device’s storage is full, so your latest change isn’t saved. Remove a photo or delete a pattern, then try again.',
  unavailable: 'This browser isn’t letting Sigrid save right now, so your latest change isn’t saved. Private browsing can cause this.',
  unreadable: 'Some saved work couldn’t be read. It’s still kept on this device, and everything else is safe.',
}

/** Says so when something couldn't be saved or read, or the device is offline: work should never disappear quietly. */
export function StorageAlerts() {
  useEffect(() => {
    // Unreadable data is found again on every read, so say that once per visit
    let toldUnreadable = false
    const onProblem = (e: Event) => {
      const problem = (e as CustomEvent<StorageProblem>).detail
      if (problem === 'unreadable') {
        if (toldUnreadable) return
        toldUnreadable = true
      }
      // The id keeps repeated failures, one per keystroke, to a single message
      toast.error(MESSAGES[problem], { id: `storage-${problem}`, duration: 10_000 })
    }
    window.addEventListener(STORAGE_PROBLEM_EVENT, onProblem)

    // Offline: nothing is lost, but saving to the account and loading new things wait. It's said once and
    // stays until the connection is back; the sync picks up by itself then (lib/sewing-sync).
    const offline = () =>
      toast.warning('You’re offline. Your sewing is saved on this device and goes up to your account when you’re back online. Pages that need the internet won’t load until then.', {
        id: 'offline',
        duration: Infinity,
      })
    const online = () => toast.dismiss('offline')
    if (!navigator.onLine) offline()
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      window.removeEventListener(STORAGE_PROBLEM_EVENT, onProblem)
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
  }, [])
  return null
}
