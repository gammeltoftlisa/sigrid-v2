'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { IconDownload, IconTrash } from '@tabler/icons-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useConsent } from '@/components/consent'
import { SettingsRow } from '@/components/patterns/settings'
import { hasGranted, type ConsentKind } from '@/lib/consent'

const SWITCHES: Record<'analytics' | 'marketing', { title: string; description: string; on: string; off: string }> = {
  analytics: {
    title: 'Measure how I use Sigrid',
    description: 'Which pages and features are used, counted without cookies, to make Sigrid better.',
    on: 'Thanks. Sigrid now counts which pages you use.',
    off: 'Done. Nothing is measured any more.',
  },
  marketing: {
    title: 'Emails about new patterns and offers',
    description: 'Now and then, never shared. Your account emails, like receipts, come either way.',
    on: 'Done. We’ll email you about new patterns and offers.',
    off: 'Done. No more emails about patterns and offers.',
  },
}

/** An optional consent as a switch: off unless the person has said yes, and saying no is the same one tap */
export function ConsentRow({ kind }: { kind: 'analytics' | 'marketing' }) {
  const { state, analytics, answer } = useConsent()
  const [busy, setBusy] = useState(false)
  const on = kind === 'analytics' ? analytics === true : !!state && hasGranted(state, 'marketing')
  const copy = SWITCHES[kind]
  const set = async (granted: boolean) => {
    setBusy(true)
    try {
      await answer([{ kind: kind as ConsentKind, granted }], 'settings')
      toast.success(granted ? copy.on : copy.off)
    } catch {
      toast.error('Couldn’t save that, so nothing changed. This is usually a connection problem.', {
        action: { label: 'Try again', onClick: () => void set(granted) },
      })
    } finally {
      setBusy(false)
    }
  }
  return (
    <SettingsRow title={copy.title} description={copy.description}>
      <Switch checked={on} disabled={busy || !state} onCheckedChange={(c) => void set(c)} aria-label={copy.title} />
    </SettingsRow>
  )
}

/** Right of access and portability: one file with everything, from the account and from this device */
export function DownloadDataRow() {
  const [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/me/export', { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      const account = await res.json()
      // What's only kept in this browser: projects not yet synced, the fabric bag, the profile picture
      const thisDevice: Record<string, string> = {}
      for (const key of Object.keys(localStorage).filter((k) => k.startsWith('sigrid_'))) thisDevice[key] = localStorage.getItem(key) ?? ''
      const file = new Blob([JSON.stringify({ ...account, thisDevice }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = `sigrid-my-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Couldn’t put your data together just now. This is usually a connection problem.', {
        action: { label: 'Try again', onClick: () => void download() },
      })
    } finally {
      setBusy(false)
    }
  }
  return (
    <SettingsRow title="Download my data" description="Everything Sigrid holds about you, as one file you can keep or take elsewhere.">
      <Button variant="outline" disabled={busy} onClick={download}>
        <IconDownload data-icon="inline-start" />
        {busy ? 'Preparing…' : 'Download'}
      </Button>
    </SettingsRow>
  )
}

/** Right to erasure, all of it: the login, sewing, answers and this device's copy. Purchases stay 7 years, by law. */
export function DeleteAccountRow() {
  const { signOut } = useClerk()
  const remove = async () => {
    try {
      const res = await fetch('/api/me', { method: 'DELETE' })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      toast.error('Couldn’t delete your account, so nothing was deleted. This is usually a connection problem.', {
        action: { label: 'Try again', onClick: () => void remove() },
      })
      return
    }
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('sigrid_')).forEach((k) => localStorage.removeItem(k))
      Object.keys(sessionStorage).filter((k) => k.startsWith('sigrid_')).forEach((k) => sessionStorage.removeItem(k))
    } catch {}
    // The account is gone, so its session may fail to sign out cleanly: a full reload then leaves nothing in memory
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    await signOut({ redirectUrl: '/sign-in' }).catch(() => window.location.assign('/sign-in'))
  }
  return (
    <SettingsRow
      title="Delete my account"
      description="Your login, sewing, size, answers and everything on this device. Receipts for patterns you bought are kept 7 years, as Swedish bookkeeping law requires, then deleted."
    >
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          <IconTrash data-icon="inline-start" />
          Delete my account
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your login, projects, progress, size, sewing history, answers and everything saved on this device are deleted, and you’re logged out. Patterns you
              bought can’t be opened any more. Receipts for them are kept 7 years for bookkeeping, then deleted. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my account</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsRow>
  )
}
