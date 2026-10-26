'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { PageBreadcrumbs, type Crumb } from '@/components/patterns/page-breadcrumbs'

interface Props {
  garmentName: string
  /** Links the garment crumb back to its page */
  garmentId?: string
  /** Where the garment crumb links instead (e.g. the pattern in the studio) */
  garmentHref?: string
  /** Crumbs before the garment, e.g. "Pattern studio" */
  trail?: Crumb[]
  onClose: () => void
  /** Shown next to the garment name, e.g. the project's size chip */
  children?: ReactNode
}

/** Top bar of the sewing sheet: what you're making, its settings, and a way out. */
export default function FlowHeader({ garmentName, garmentId, garmentHref, trail = [], onClose, children }: Props) {
  const href = garmentHref ?? (garmentId ? `/garment/${garmentId}` : undefined)
  return (
    <div className="w-full shrink-0 flex items-center justify-between gap-3 px-4 py-3 md:px-5">
      <div className="flex items-center gap-2 min-w-0">
        {/* Phones: just the garment, so nothing gets cut off; the full trail from sm */}
        {href ? (
          <Link href={href} className="truncate text-sm font-medium underline-offset-4 hover:underline sm:hidden">
            {garmentName}
          </Link>
        ) : (
          <span className="truncate text-sm font-medium sm:hidden">{garmentName}</span>
        )}
        <PageBreadcrumbs
          items={[
            ...trail,
            { label: garmentName, href },
            { label: 'Sewing guide' },
          ]}
          className="hidden whitespace-nowrap sm:flex"
        />
        {children}
      </div>
      <Button variant="outline" size="icon-lg" aria-label="Close project" title="Close project" onClick={onClose}>
        <IconX />
      </Button>
    </div>
  )
}
