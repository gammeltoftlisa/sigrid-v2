'use client'

import Link from 'next/link'
import { useClerk, useUser } from '@clerk/nextjs'

import { Button } from '@/components/ui/button'
import { SettingsGroup, SettingsRow } from '@/components/patterns/settings'
import { usePurchases } from '@/hooks/use-purchases'
import { getCatalogItem } from '@/lib/data'
import { paymentsEnabled } from '@/lib/payments'
import { flushSewing } from '@/lib/sewing-sync'

/** Who this is, for the top of Profile: the name and email. */
export function AccountIdentity() {
  const { isLoaded, isSignedIn, user } = useUser()
  // The proxy only lets logged-in people here, so this is just the moment before Clerk has loaded
  if (!isLoaded || !isSignedIn) return <p className="text-sm text-muted-foreground">Checking…</p>
  const email = user.primaryEmailAddress?.emailAddress
  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <p className="title-md truncate">{user.fullName || 'Logged in'}</p>
      <p className="truncate text-sm text-muted-foreground" title={email}>{email}</p>
    </div>
  )
}

/** Manage the account and log out. The account screens themselves are Clerk's (see lib/clerk-appearance). */
export function AccountSettings() {
  const { isLoaded, isSignedIn } = useUser()
  const { openUserProfile, signOut } = useClerk()
  const purchases = usePurchases()

  if (!isLoaded || !isSignedIn) return null

  return (
    <SettingsGroup label="Account">
      <SettingsRow title="Login and security" description="Your email, password and devices.">
        <Button variant="outline" onClick={() => openUserProfile()}>Manage account</Button>
      </SettingsRow>
      {paymentsEnabled && purchases.garmentIds.length > 0 && (
        <SettingsRow
          title="Your patterns"
          description={purchases.garmentIds.map((id, i) => (
            <span key={id}>
              {i > 0 && ', '}
              <Link href={`/garment/${id}`} className="underline underline-offset-4">{getCatalogItem(id)?.name ?? id}</Link>
            </span>
          ))}
        />
      )}
      <SettingsRow title="Log out" description="Your sewing stays on your account.">
        <Button variant="outline" onClick={async () => { await flushSewing(); await signOut({ redirectUrl: '/sign-in' }) }}>Log out</Button>
      </SettingsRow>
    </SettingsGroup>
  )
}
