'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconBell, IconRuler2, IconSparkles, IconTrash } from '@tabler/icons-react'
import { useTheme } from 'next-themes'
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
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { AccountPanel } from '@/components/patterns/account-panel'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'
import { ProfilePhoto } from '@/components/patterns/profile-photo'
import { SizePicker } from '@/components/patterns/size-picker'
import { useMounted } from '@/hooks/use-mounted'
import { allSizes, loadSavedSize, saveSize, sizeLabel } from '@/lib/sizes'
import { eraseAccountSewing } from '@/lib/sewing-sync'
import { useAuth } from '@clerk/nextjs'
import type { StandardSize } from '@/lib/types'

const appearances = ['System', 'Light', 'Dark'] as const

export default function ProfilePage() {
  const { theme, setTheme } = useTheme()
  // Off until the user switches it on: reminders need opt-in consent
  const [notifications, setNotifications] = useState(false)
  const [picked, setPicked] = useState<StandardSize | null>(null)
  const mounted = useMounted()
  const size = picked ?? (mounted ? loadSavedSize() : null)
  const { isSignedIn } = useAuth()

  const selectSize = (s: StandardSize) => {
    setPicked(s)
    saveSize(s)
    toast.success(`Saved. New patterns start in ${sizeLabel(s)}.`)
  }

  // Right to erasure: what's saved on the account goes first, and if that fails nothing is deleted
  const deleteData = async () => {
    if (isSignedIn) {
      try {
        await eraseAccountSewing()
      } catch {
        toast.error('Couldn’t delete your data. Nothing was deleted, so please try again.')
        return
      }
    }
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('sigrid_')).forEach((k) => localStorage.removeItem(k))
      Object.keys(sessionStorage).filter((k) => k.startsWith('sigrid_')).forEach((k) => sessionStorage.removeItem(k))
    } catch {}
    setPicked(null)
    toast.success(isSignedIn ? 'Your data is deleted from your account and this device.' : 'Your data on this device is deleted.')
    // A full reload on purpose, so nothing from the deleted data survives in memory
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/onboarding')
  }

  const deleteButton = (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" className="w-full" />}>
        <IconTrash data-icon="inline-start" />
        Delete my data
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your data?</AlertDialogTitle>
          <AlertDialogDescription>
            Your projects, progress, size, streak history, fabric bag and profile picture on this device will be deleted, along with your projects, progress, size and streak history on your account. Your login and patterns you’ve bought stay. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep my data</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={deleteData}>
            Delete my data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <PageContainer>
      <PageHeader breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Profile' }]} title="Profile" />

      <div className="grid-12">
        <div className="col-side flex flex-col gap-6">
        <Panel label="Profile picture">
          <ProfilePhoto />
        </Panel>
        <AccountPanel />
        <Panel label="Your data" footer={deleteButton}>
          <p className="px-1 text-sm text-muted-foreground">
            Your projects, progress, size and photo are saved on this device only, even when you’re logged in. To delete your account, use Manage account.{' '}
            <Link href="/legal/privacy" className="text-foreground underline underline-offset-4">Privacy policy</Link>
          </p>
        </Panel>
        </div>

        <div className="col-main flex flex-col gap-6">
          <Panel label="My size" meta={size ? sizeLabel(size) : 'Not set'}>
            <p className="px-1 pb-2 text-sm text-muted-foreground">New patterns start in this size.</p>
            <SizePicker sizes={allSizes} value={size} onValueChange={selectSize} label="My usual size" />
          </Panel>

          <Panel label="Appearance">
            <p className="px-1 pb-2 text-sm text-muted-foreground">Light, dark, or the same as your device.</p>
            {mounted && (
              <CategoryTabs
                label="Appearance"
                options={appearances}
                value={appearances.find((a) => a.toLowerCase() === theme) ?? 'System'}
                onValueChange={(a) => setTheme(a.toLowerCase())}
              />
            )}
          </Panel>

          <Panel label="Settings">
            <PanelRow
              leading={
                <StepDot state="upcoming">
                  <IconBell className="size-3.5" />
                </StepDot>
              }
              title={<label htmlFor="notifications">Reminders</label>}
              trailing={<Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />}
            />
            <PanelRow
              href="/payment"
              leading={
                <StepDot state="upcoming">
                  <IconSparkles className="size-3.5" />
                </StepDot>
              }
              title="Plan"
              meta="Free in beta"
            />
            <PanelRow
              href="/studio"
              leading={
                <StepDot state="upcoming">
                  <IconRuler2 className="size-3.5" />
                </StepDot>
              }
              title="Pattern studio"
              detail="For pattern makers: write and sell your own patterns"
            />
          </Panel>

        </div>
      </div>
    </PageContainer>
  )
}
