'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { Pill } from '@/components/patterns/profile-header'
import { SettingsRow } from '@/components/patterns/settings'
import { accountTypes, useAccountType, type AccountType } from '@/hooks/use-account-type'
import { flushSewing } from '@/lib/sewing-sync'

/**
 * Who this is, for the card on You: the name (the page's heading, as on any profile), the email and the kind of
 * user. Without a name on the account, the part of the email before the @ stands in.
 */
export function AccountIdentity() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { type, ready } = useAccountType()
  // The proxy only lets logged-in people here, so this is just the moment before Clerk has loaded
  if (!isLoaded || !isSignedIn) return <p className="text-sm text-muted-foreground">Checking…</p>
  const email = user.primaryEmailAddress?.emailAddress
  const name = user.fullName || email?.split('@')[0] || 'Your profile'
  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <h1 className="title-lg truncate">{name}</h1>
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
      toast.error(`Couldn’t switch to ${label}, so your account type is unchanged. This is usually a connection problem.`, {
        action: { label: 'Try again', onClick: () => void choose(label) },
      })
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
