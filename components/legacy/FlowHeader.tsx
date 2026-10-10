'use client'

import type { ReactNode } from 'react'
import { IconX } from '@tabler/icons-react'
import IconButton from './IconButton'

interface Props {
  garmentName: string
  onClose: () => void
  /** Shown next to the garment name, e.g. the project's size chip */
  children?: ReactNode
}

/** Top bar of the sewing sheet: what you're making, its settings, and a way out. */
export default function FlowHeader({ garmentName, onClose, children }: Props) {
  return (
    <div className="w-full shrink-0 bg-bg border-b border-rim flex items-center justify-between gap-3 px-5 py-3.5">
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-label font-bold text-ink truncate">{garmentName}</p>
        {children}
      </div>
      <IconButton label="Close project" onClick={onClose}>
        <IconX size={16} />
      </IconButton>
    </div>
  )
}
