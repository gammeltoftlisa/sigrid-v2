'use client'

import { useState } from 'react'
import { IconBell, IconLogout, IconSparkles } from '@tabler/icons-react'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel, PanelRow, StepDot } from '@/components/patterns/panel'
import { SizePicker } from '@/components/patterns/size-picker'
import { useMounted } from '@/hooks/use-mounted'
import { creators } from '@/lib/data'
import { allSizes, loadSavedSize, saveSize, sizeLabel } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true)
  const [picked, setPicked] = useState<StandardSize | null>(null)
  const mounted = useMounted()
  const size = picked ?? (mounted ? loadSavedSize() : null)
  const followed = creators.slice(0, 2)

  const selectSize = (s: StandardSize) => {
    setPicked(s)
    saveSize(s)
    toast.success(`Saved. New patterns start in ${sizeLabel(s)}.`)
  }

  const signOut = (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" className="w-full" />}>
        <IconLogout data-icon="inline-start" />
        Sign out
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out?</AlertDialogTitle>
          <AlertDialogDescription>Your projects and progress stay saved on this device.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay signed in</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Sign out</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <PageContainer>
      <PageHeader breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Profile' }]} title="Profile" />

      <div className="grid gap-6 lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
        <Panel
          label="Account"
          meta="Free beta"
          className="lg:sticky lg:top-20 lg:self-start"
          footer={signOut}
        >
          <div className="flex items-center gap-4 px-1 py-2">
            <Avatar className="size-14">
              <AvatarFallback className="text-lg">E</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <p className="text-lg font-semibold">Emma</p>
              <p className="truncate text-sm text-muted-foreground">emma@example.com</p>
            </div>
          </div>
          <PanelRow
            state={size ? 'done' : 'active'}
            leading={<StepDot state={size ? 'done' : 'active'}>1</StepDot>}
            title={size ? 'Usual size saved' : 'Choose your usual size'}
            meta={size ? sizeLabel(size) : undefined}
          />
          <PanelRow
            leading={<StepDot state={followed.length ? 'done' : 'upcoming'}>2</StepDot>}
            state={followed.length ? 'done' : 'upcoming'}
            title="Follow pattern makers"
            meta={followed.length}
          />
        </Panel>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel label="My size" meta={size ? sizeLabel(size) : 'Not set'}>
            <p className="max-w-prose px-1 pb-2 text-sm text-muted-foreground">
              {size
                ? 'New patterns start in this size. You can still choose another size for each garment.'
                : 'Choose the size you usually buy and we’ll start every pattern in it. You can change it anytime.'}
            </p>
            <SizePicker sizes={allSizes} value={size} onValueChange={selectSize} label="My usual size" />
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel label="Preferences">
              <PanelRow
                leading={
                  <StepDot state="upcoming">
                    <IconBell className="size-3.5" />
                  </StepDot>
                }
                title={<label htmlFor="notifications">Push notifications</label>}
                detail="Gentle reminders and the occasional sewing tip"
                trailing={<Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />}
              />
            </Panel>

            <Panel label="Subscription" meta="Free in beta">
              <PanelRow
                href="/payment"
                leading={
                  <StepDot state="upcoming">
                    <IconSparkles className="size-3.5" />
                  </StepDot>
                }
                title="Beta access"
                detail="Everything is free while we’re in beta. See what we’re planning."
              />
            </Panel>
          </div>

          <Panel label="Creators you follow" meta={followed.length}>
            {followed.map((c) => (
              <PanelRow
                key={c.id}
                href={`/creator/${c.id}`}
                leading={<CreatorAvatar creator={c} />}
                title={c.handle}
                detail={`${c.followerCount} followers${c.isCertified ? ' · Certified' : ''}`}
              />
            ))}
          </Panel>
        </div>
      </div>
    </PageContainer>
  )
}
