'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

/** The site's address: Home for anyone who has been here before, the welcome for everyone else. */
export default function RootPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isLoaded) return
    let returning = !!isSignedIn
    try {
      // Everything Sigrid saves starts with sigrid_, including having finished the welcome
      returning ||= Object.keys(localStorage).some((key) => key.startsWith('sigrid_'))
    } catch {}
    router.replace(returning ? '/home' : '/onboarding')
  }, [isLoaded, isSignedIn, router])

  return null
}
