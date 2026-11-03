'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconArrowLeft } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

/**
 * A way back to logging in from anywhere in signing up, or from a later step of logging in
 * (the code, the password). Someone who tapped "Create account" by mistake is never stuck.
 */
export function AuthBack() {
  const path = usePathname()
  const signingUp = path.startsWith('/sign-up')
  const laterSignInStep = path.startsWith('/sign-in/')
  if (!signingUp && !laterSignInStep) return null
  return (
    <Button variant="outline" size="lg" className="auth-back" nativeButton={false} render={<Link href="/sign-in" />}>
      <IconArrowLeft />
      {signingUp ? 'Back to log in' : 'Back'}
    </Button>
  )
}
