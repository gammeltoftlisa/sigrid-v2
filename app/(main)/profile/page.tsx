'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconCertificate, IconChevronRight, IconLogout } from '@tabler/icons-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { PageSection } from '@/components/patterns/page-section'
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

  return (
    <PageContainer>
      <PageHeader breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Profile' }]} title="Profile" />

      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="text-xl">E</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <p className="text-lg font-semibold">Emma</p>
          <p className="truncate text-sm text-muted-foreground">emma@example.com</p>
        </div>
      </div>

      <PageSection
        title="My size"
        description={
          size
            ? `New patterns start in ${sizeLabel(size)}. You can still choose another size for each garment.`
            : 'Choose the size you usually buy and we’ll start every pattern in it. You can change it anytime.'
        }
      >
        <SizePicker sizes={allSizes} value={size} onValueChange={selectSize} label="My usual size" />
      </PageSection>

      <PageSection title="Preferences">
        <Card>
          <CardContent>
            <Field orientation="horizontal">
              <div className="flex flex-1 flex-col gap-0.5">
                <FieldLabel htmlFor="notifications">Push notifications</FieldLabel>
                <FieldDescription>Gentle reminders and the occasional sewing tip</FieldDescription>
              </div>
              <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
            </Field>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection title="Subscription">
        <Link
          href="/payment"
          className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Card className="transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Beta access</CardTitle>
              <CardDescription>Everything is free while we’re in beta. See what we’re planning.</CardDescription>
              <div className="col-start-2 row-span-2 row-start-1 flex items-center gap-2 self-center">
                <span className="eyebrow text-muted-foreground">Free in beta</span>
                <IconChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </PageSection>

      <PageSection title="Creators you follow">
        <Card className="py-0">
          <ul>
            {followed.map((c, i) => (
              <li key={c.id}>
                {i > 0 && <Separator />}
                <Link
                  href={`/creator/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted"
                >
                  <CreatorAvatar creator={c} size="lg" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{c.handle}</span>
                    <span className="text-sm text-muted-foreground">{c.followerCount} followers</span>
                  </span>
                  {c.isCertified && (
                    <IconCertificate className="size-4 text-muted-foreground" aria-label="Certified creator" />
                  )}
                  <IconChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </PageSection>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" size="lg" className="w-full sm:w-auto sm:self-start" />}>
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
    </PageContainer>
  )
}
