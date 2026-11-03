'use client'

import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccountTypeRow, LoginRow, LogOutRow } from '@/components/patterns/account-panel'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { legalPages } from '@/components/patterns/legal-page'
import { ConsentRow, DeleteAccountRow, DownloadDataRow } from '@/components/patterns/privacy-settings'
import { SettingsGroup, SettingsLinks, SettingsList, SettingsRow } from '@/components/patterns/settings'
import { useMounted } from '@/hooks/use-mounted'
import { eraseAccountSewing } from '@/lib/sewing-sync'
import { allSizes, loadSavedSize, saveSize, sizeLabel } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'

const appearances = ['System', 'Light', 'Dark'] as const
const sizeOptions = allSizes.map((s) => ({ value: s, label: sizeLabel(s) }))

/**
 * Settings, reached from You: how the app behaves for you, your login, your data and the policies.
 * Who you are and what you own and make live on You itself.
 */
export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [picked, setPicked] = useState<StandardSize | null>(null)
  const mounted = useMounted()
  const size = picked ?? (mounted ? loadSavedSize() : null)

  const selectSize = (s: StandardSize) => {
    setPicked(s)
    saveSize(s)
    toast.success(`Saved. New patterns start in ${sizeLabel(s)}.`)
  }

  // Right to erasure: what's saved on the account goes first, and if that fails nothing is deleted
  const deleteData = async () => {
    try {
      await eraseAccountSewing()
    } catch {
      toast.error('Couldn’t reach your account, so nothing was deleted. This is usually a connection problem.', {
        action: { label: 'Try again', onClick: () => void deleteData() },
      })
      return
    }
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('sigrid_')).forEach((k) => localStorage.removeItem(k))
      Object.keys(sessionStorage).filter((k) => k.startsWith('sigrid_')).forEach((k) => sessionStorage.removeItem(k))
    } catch {}
    setPicked(null)
    toast.success('Your data is deleted from your account and this device.')
    // A full reload on purpose, so nothing from the deleted data survives in memory
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/onboarding')
  }

  return (
    <PageContainer>
      <PageHeader title="Settings" breadcrumbs={[{ label: 'You', href: '/profile' }, { label: 'Settings' }]} />

      <div className="flex flex-col gap-3">
        <SettingsList>
          <SettingsGroup label="About you">
            <AccountTypeRow />
            <SettingsRow title="My size" description="New patterns start in this size.">
              <Select items={sizeOptions} value={size} onValueChange={(s) => s && selectSize(s as StandardSize)}>
                <SelectTrigger aria-label="My size" className="w-40">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsRow>
          </SettingsGroup>
        </SettingsList>


        <SettingsList>
          <SettingsGroup label="Settings">
            <SettingsRow title="Appearance" description="Light, dark, or the same as your device.">
              {mounted && (
                <CategoryTabs
                  label="Appearance"
                  options={appearances}
                  value={appearances.find((a) => a.toLowerCase() === theme) ?? 'System'}
                  onValueChange={(a) => setTheme(a.toLowerCase())}
                />
              )}
            </SettingsRow>
            <LoginRow />
            <LogOutRow />
          </SettingsGroup>
          {/* Optional answers, each its own switch, off unless the person said yes */}
          <SettingsGroup label="Privacy">
            <ConsentRow kind="analytics" />
            <ConsentRow kind="marketing" />
          </SettingsGroup>
          <SettingsGroup label="Your data">
            <SettingsRow
              title="Where it’s saved"
              description="Your projects, progress and size are on your account. Your photo and fabric bag stay on this device."
            />
            <DownloadDataRow />
            <SettingsRow title="Delete my sewing" description="Removes your projects, progress and size, and keeps your account.">
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>
                  <IconTrash data-icon="inline-start" />
                  Delete my sewing
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your sewing?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your projects, progress, size, sewing history, fabric bag and profile picture on this device will be deleted, along with your projects, progress, size and sewing history on your account. Your login and patterns you’ve bought stay. This can’t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={deleteData}>
                      Delete my sewing
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SettingsRow>
            <DeleteAccountRow />
          </SettingsGroup>
        </SettingsList>

        <SettingsList solid>
          <SettingsGroup label="About Sigrid">
            <SettingsLinks label="About Sigrid" links={legalPages} />
          </SettingsGroup>
        </SettingsList>
      </div>
    </PageContainer>
  )
}
