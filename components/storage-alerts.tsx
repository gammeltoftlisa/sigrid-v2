'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

import { STORAGE_PROBLEM_EVENT, type StorageProblem } from '@/lib/local-store'

const MESSAGES: Record<StorageProblem, string> = {
  full: 'This device’s storage is full, so your latest change isn’t saved. Remove a photo or delete a pattern, then try again.',
  unavailable: 'This browser isn’t letting Sigrid save right now, so your latest change isn’t saved. Private browsing can cause this.',
  unreadable: 'Some saved work couldn’t be read. It’s still kept on this device, and everything else is safe.',
}

/** Says so when something couldn't be saved or read: work should never disappear quietly. */
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
    return () => window.removeEventListener(STORAGE_PROBLEM_EVENT, onProblem)
  }, [])
  return null
}
