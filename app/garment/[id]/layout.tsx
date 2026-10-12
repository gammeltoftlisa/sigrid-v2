'use client'

import { use } from 'react'
import { usePathname } from 'next/navigation'
import GarmentDetailBg from '@/components/garment/GarmentDetailBg'
import { AppShell } from '@/components/patterns/app-nav'

export default function GarmentIdLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const pathname = usePathname()
  // The sewing guide and the printable pattern take the whole screen; everything else sits in the app frame
  const isFlowPage = pathname === `/garment/${id}/guide`
  const isPrintPage = pathname === `/garment/${id}/pattern`

  if (isFlowPage) {
    return (
      <>
        {/* The garment page shows behind the sewing sheet */}
        <GarmentDetailBg garmentId={id} />
        {children}
      </>
    )
  }
  if (isPrintPage) return children
  return <AppShell>{children}</AppShell>
}
