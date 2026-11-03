'use client'

import { use } from 'react'
import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/patterns/app-nav'
import { PublishedGate } from '@/components/garment/published-gate'

/** The app frame around a pattern's pages; the printable pattern goes without it */
export function GarmentFrame({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const pathname = usePathname()
  // The printable pattern takes the whole screen; everything else sits in the app frame
  if (pathname === `/garment/${id}/pattern`) return <PublishedGate id={id}>{children}</PublishedGate>
  return (
    <AppShell>
      <PublishedGate id={id}>{children}</PublishedGate>
    </AppShell>
  )
}
