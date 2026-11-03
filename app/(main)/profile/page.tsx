'use client'

import Link from 'next/link'
import { IconSettings } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { AccountIdentity } from '@/components/patterns/account-panel'
import { PageContainer } from '@/components/patterns/page-header'
import { ProfileHeader } from '@/components/patterns/profile-header'
import { ProfilePhoto } from '@/components/patterns/profile-photo'
import { MadePatterns, OwnedPatterns } from '@/components/patterns/your-patterns'
import { useAccountType } from '@/hooks/use-account-type'

/**
 * You: an overview of you and what's yours. No page title: your name is the heading, in your card, as on any
 * profile (the tab already says where you are). Then what you've made (pattern makers) and the patterns you own.
 * Everything to change how the app works for you is in Settings, right under your name.
 */
export default function YouPage() {
  const { type, ready } = useAccountType()
  const settings = (
    <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/profile/settings" />}>
      <IconSettings data-icon="inline-start" />
      Settings
    </Button>
  )

  return (
    <PageContainer>
      <div className="grid-12">
        {/* The same card as a maker's page; Settings sits right under who you are, like Edit profile */}
        <ProfileHeader className="col-side" avatar={<ProfilePhoto />} name={<AccountIdentity />} action={settings} />

        <div className="col-main flex flex-col gap-3">
          {ready && type === 'maker' && <MadePatterns />}
          <OwnedPatterns primary={!(ready && type === 'maker')} />
        </div>
      </div>
    </PageContainer>
  )
}
