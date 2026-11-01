'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

import { setSewingUser } from '@/lib/sewing-sync'

/** Starts and stops saving sewing to the account as people log in and out. Draws nothing. */
export function SewingSync() {
  const { isLoaded, userId } = useAuth()
  useEffect(() => {
    if (isLoaded) setSewingUser(userId ?? null)
  }, [isLoaded, userId])
  return null
}
