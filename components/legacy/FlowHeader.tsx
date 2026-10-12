'use client'

import type { ReactNode } from 'react'
import { IconX } from '@tabler/icons-react'
import IconButton from './IconButton'
import { PageBreadcrumbs } from '@/components/patterns/page-breadcrumbs'

interface Props {
  garmentName: string
  /** Links the garment crumb back to its page */
  garmentId?: string
  onClose: () => void
  /** Shown next to the garment name, e.g. the project's size chip */
  children?: ReactNode
}

/** Top bar of the sewing sheet: what you're making, its settings, and a way out. */
export default function FlowHeader({ garmentName, garmentId, onClose, children }: Props) {
  return (
    <div className="w-full shrink-0 flex items-center justify-between gap-3 px-4 py-3 md:px-5">
      <div className="flex items-center gap-2 min-w-0">
        <PageBreadcrumbs
          items={[
            { label: garmentName, href: garmentId ? `/garment/${garmentId}` : undefined },
            { label: 'Sewing guide' },
          ]}
          className="whitespace-nowrap"
        />
        {children}
      </div>
      <IconButton label="Close project" onClick={onClose}>
        <IconX size={16} />
      </IconButton>
    </div>
  )
}
