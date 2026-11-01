'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconChevronRight, IconTrash } from '@tabler/icons-react'
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
import { AccountIdentity, AccountSettings } from '@/components/patterns/account-panel'
import { CategoryTabs } from '@/components/patterns/category-tabs'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { ProfilePhoto } from '@/components/patterns/profile-photo'
import { legalPages } from '@/components/patterns/legal-page'
import { SettingsGroup, SettingsLinks, SettingsList, SettingsRow } from '@/components/patterns/settings'
import { useMounted } from '@/hooks/use-mounted'
import { eraseAccountSewing } from '@/lib/sewing-sync'
import { allSizes, loadSavedSize, saveSize, sizeLabel } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'

const appearances = ['System', 'Light', 'Dark'] as const
const sizeOptions = allSizes.map((s) => ({ value: s, label: sizeLabel(s) }))

export default function ProfilePage() {
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
      toast.error('Couldn’t delete your data. Nothing was deleted, so please try again.')
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
      <PageHeader title="Profile" className="pt-8 md:pt-12" />

      <div className="grid-12">
        <div className="col-side glass-panel flex flex-col items-start gap-4 rounded-(--radius) border p-4">
          <ProfilePhoto>
            <AccountIdentity />
          </ProfilePhoto>
        </div>

        <SettingsList className="col-main">
          <AccountSettings />

          <SettingsGroup label="Preferences">
            <SettingsRow title="My size" description="New patterns start in this size.">
              <Select items={sizeOptions} value={size} onValueChange={(s) => s && selectSize(s as StandardSize)}>
                <SelectTrigger aria-label="My size" className="w-32">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsRow>
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
          </SettingsGroup>

          <SettingsGroup label="For makers">
            <SettingsRow title="Pattern studio" description="Write the sewing guide for your own pattern.">
              <Button variant="outline" nativeButton={false} render={<Link href="/studio" />}>
                Open studio
                <IconChevronRight data-icon="inline-end" />
              </Button>
            </SettingsRow>
          </SettingsGroup>

          <SettingsGroup label="Legal">
            <SettingsLinks label="Legal" links={legalPages} />
          </SettingsGroup>

          <SettingsGroup label="Your data">
            <SettingsRow
              title="Where it’s saved"
              description="Your projects, progress and size are on your account. Your photo and fabric bag stay on this device."
            />
            <SettingsRow title="Delete my data" description="Removes your projects, progress and size. To delete your whole account, use Manage account.">
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>
                  <IconTrash data-icon="inline-start" />
                  Delete my data
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your projects, progress, size, sewing history, fabric bag and profile picture on this device will be deleted, along with your projects, progress, size and sewing history on your account. Your login and patterns you’ve bought stay. This can’t be undone.
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
            </SettingsRow>
          </SettingsGroup>
        </SettingsList>
      </div>
    </PageContainer>
  )
}
