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
  const isFlowPage = pathname !== `/garment/${id}`

  return (
    <>
      {isFlowPage && <GarmentDetailBg garmentId={id} />}
      {children}
    </>
  )
}
