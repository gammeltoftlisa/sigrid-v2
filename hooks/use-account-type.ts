'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

import { useMounted } from '@/hooks/use-mounted'
import { loadPatterns } from '@/lib/studio/patterns'

/** What kind of user someone is: a sewer buys patterns, a pattern maker sells their own. */
export const accountTypes = {
  sewer: { label: 'Sewer', detail: 'Buys and sews patterns' },
  maker: { label: 'Pattern maker', detail: 'Sells their own patterns' },
} as const

export type AccountType = keyof typeof accountTypes

const isAccountType = (value: unknown): value is AccountType => value === 'sewer' || value === 'maker'

/**
 * The account type, kept on the Clerk account so it follows the user between devices. Anyone can change their own,
 * so it decides what the screens show and must never decide what someone may do or pay for.
 * Someone who has never chosen is a sewer, unless they already have patterns in the studio on this device.
 */
export function useAccountType() {
  const { isLoaded, user } = useUser()
  const mounted = useMounted()
  const [choice, setChoice] = useState<AccountType | null>(null)

  const saved = user?.unsafeMetadata.accountType
  const fallback: AccountType = mounted && !isAccountType(saved) && loadPatterns().length > 0 ? 'maker' : 'sewer'
  const type = choice ?? (isAccountType(saved) ? saved : fallback)

  /** Shows the new type straight away, and goes back to the old one if saving fails, then throws */
  const setType = async (next: AccountType) => {
    if (!user) return
    setChoice(next)
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, accountType: next } })
    } catch (e) {
      setChoice(null)
      throw e
    }
  }

  return { type, setType, ready: isLoaded && !!user && mounted }
}
