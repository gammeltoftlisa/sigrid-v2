'use client'

import { use } from 'react'
import { usePathname } from 'next/navigation'
import GarmentDetailBg from '@/components/garment/GarmentDetailBg'

export default function GarmentIdLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const pathname = usePathname()
  // The garment page shows behind the sewing sheet — not behind the printable pattern
  const isFlowPage = pathname === `/garment/${id}/guide`

  return (
    <>
      {isFlowPage && <GarmentDetailBg garmentId={id} />}
      {children}
    </>
  )
}
