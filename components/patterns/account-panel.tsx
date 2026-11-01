'use client'

import Link from 'next/link'
import { useClerk, useUser } from '@clerk/nextjs'

import { Button } from '@/components/ui/button'
import { Panel, PanelRow } from '@/components/patterns/panel'
import { usePurchases } from '@/hooks/use-purchases'
import { getCatalogItem } from '@/lib/data'
import { paymentsEnabled } from '@/lib/payments'
import { flushSewing } from '@/lib/sewing-sync'

/** Log in, or manage the account. The account screens themselves are Clerk's. */
export function AccountPanel() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  const purchases = usePurchases()

  if (!isLoaded) return <Panel label="Account"><p className="px-1 text-sm text-muted-foreground">Checking…</p></Panel>

  if (!isSignedIn) {
    return (
      <Panel label="Account">
        <p className="px-1 pb-2 text-sm text-muted-foreground">Log in to keep your projects and progress on all your devices. Browsing needs no account.</p>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/sign-in?redirect_url=/profile" />}>Log in</Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/sign-up?redirect_url=/profile" />}>Create account</Button>
        </div>
      </Panel>
    )
  }

  return (
    <Panel label="Account">
      <p className="truncate px-1 pb-2 text-sm">{user.primaryEmailAddress?.emailAddress}</p>
      {paymentsEnabled && purchases.garmentIds.map((id) => (
        <PanelRow key={id} href={`/garment/${id}`} title={getCatalogItem(id)?.name ?? id} detail="Your pattern" />
      ))}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => openUserProfile()}>Manage account</Button>
        <Button variant="ghost" onClick={async () => { await flushSewing(); await signOut({ redirectUrl: '/profile' }) }}>Log out</Button>
      </div>
    </Panel>
  )
}
