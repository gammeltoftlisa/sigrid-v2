'use client'

import type { ReactNode } from 'react'
import { disabled as disabledCls, feedback, hoverOnMuted, hoverOnSurface, pressIcon } from './interaction'

interface Props {
  /** Required: icon-only buttons need a name for screen readers */
  label: string
  onClick?: () => void
  children: ReactNode
  /**
   * raised — white with a shadow, floats over page content (back buttons)
   * subtle — grey, sits inside headers and sheets (close, print)
   */
  variant?: 'raised' | 'subtle'
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}

export default function IconButton({
  label, onClick, children, variant = 'subtle', size = 'sm', disabled, className = '',
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${size === 'md' ? 'w-10 h-10' : 'w-8 h-8'} shrink-0 rounded-full flex items-center justify-center text-ink-2 ${
        variant === 'raised' ? `bg-surface shadow-soft ${hoverOnSurface}` : `bg-surface-2 ${hoverOnMuted}`
      } ${feedback} ${pressIcon} ${disabledCls} ${className}`}
    >
      {children}
    </button>
  )
}
