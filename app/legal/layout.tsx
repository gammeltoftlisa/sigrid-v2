import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

import { AppShell } from '@/components/patterns/app-nav'
import { LegalFooter } from '@/components/patterns/legal-footer'
import { Wordmark } from '@/components/patterns/wordmark'

/** Anyone can read these before agreeing to them. The menu only shows for people who can go somewhere with it. */
export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (userId) {
    return (
      <AppShell>
        <main>{children}</main>
        <LegalFooter />
      </AppShell>
    )
  }
  return (
    <div className="flex min-h-svh flex-col">
      <header className="px-4 pt-6">
        <Link href="/sign-in" aria-label="Sigrid, log in" className="title-md inline-block">
          <Wordmark />
        </Link>
      </header>
      <main className="flex-1">{children}</main>
      <LegalFooter />
    </div>
  )
}
