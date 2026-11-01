'use client'

import Link from 'next/link'
import { useClerk, useUser } from '@clerk/nextjs'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { Pill } from '@/components/patterns/profile-header'
import { SettingsRow } from '@/components/patterns/settings'
import { accountTypes, useAccountType, type AccountType } from '@/hooks/use-account-type'
import { usePurchases } from '@/hooks/use-purchases'
import { paymentsEnabled } from '@/lib/payments'
import { flushSewing } from '@/lib/sewing-sync'

/** Who this is, for the top of Profile: the name, email and kind of user. */
export function AccountIdentity() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { type, ready } = useAccountType()
  // The proxy only lets logged-in people here, so this is just the moment before Clerk has loaded
  if (!isLoaded || !isSignedIn) return <p className="text-sm text-muted-foreground">Checking…</p>
  const email = user.primaryEmailAddress?.emailAddress
  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <p className="title-md truncate">{user.fullName || 'Logged in'}</p>
      <p className="truncate text-sm text-muted-foreground" title={email}>{email}</p>
      {ready && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Pill>{accountTypes[type].label}</Pill>
          <span className="text-xs text-muted-foreground">{accountTypes[type].detail}</span>
        </div>
      )}
    </div>
  )
}

const typeByLabel = Object.fromEntries(
  (Object.keys(accountTypes) as AccountType[]).map((t) => [accountTypes[t].label, t]),
) as Record<string, AccountType>
const typeLabels = Object.keys(typeByLabel)

/** Choose between buying and selling patterns. */
export function AccountTypeRow() {
  const { type, setType, ready } = useAccountType()
  const choose = async (label: string) => {
    try {
      await setType(typeByLabel[label])
    } catch {
      toast.error('Couldn’t change your account type. Please try again.')
    }
  }
  return (
    <SettingsRow
      title="Account type"
      description={type === 'maker' ? 'You sell your own patterns, and can still buy other makers’.' : 'You buy patterns and sew them. Choose Pattern maker to sell your own.'}
    >
      {ready && <CategoryTabs label="Account type" options={typeLabels} value={accountTypes[type].label} onValueChange={choose} />}
    </SettingsRow>
  )
}

/** The patterns this account has bought, when there are any. */
export function BoughtPatternsRow() {
  const purchases = usePurchases()
  const count = purchases.garmentIds.length
  if (!paymentsEnabled || count === 0) return null
  return (
    <SettingsRow title="Patterns you’ve bought" description={count === 1 ? '1 pattern, yours for good.' : `${count} patterns, yours for good.`}>
      <Button variant="outline" nativeButton={false} render={<Link href="/patterns" />}>My patterns</Button>
    </SettingsRow>
  )
}

/** Manage the login. The account screens themselves are Clerk's (see lib/clerk-appearance). */
export function LoginRow() {
  const { openUserProfile } = useClerk()
  return (
    <SettingsRow title="Login and security" description="Your email, password and devices.">
      <Button variant="outline" onClick={() => openUserProfile()}>Manage account</Button>
    </SettingsRow>
  )
}

export function LogOutRow() {
  const { signOut } = useClerk()
  return (
    <SettingsRow title="Log out" description="Your sewing stays on your account.">
      <Button variant="outline" onClick={async () => { await flushSewing(); await signOut({ redirectUrl: '/sign-in' }) }}>Log out</Button>
    </SettingsRow>
  )
}
