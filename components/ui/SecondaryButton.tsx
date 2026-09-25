'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { disabled as disabledCls, feedback, hoverOnSurface, press } from './interaction'

interface Props {
  children: ReactNode
  onClick?: () => void
  /** Render as a link instead of wrapping the button in one */
  href?: string
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
  variant?: 'outline' | 'ghost'
}

export default function SecondaryButton({
  children,
  onClick,
  href,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = true,
  variant = 'outline',
}: Props) {
  const variantClasses =
    variant === 'outline'
      ? `border border-rim bg-surface text-ink shadow-soft ${hoverOnSurface}`
      : `bg-transparent text-ink-2 hover:text-ink ${hoverOnSurface}`
  const cls = `
    ${fullWidth ? 'w-full' : ''}
    flex items-center justify-center gap-2
    ${variantClasses}
    text-[17px] font-medium
    px-6 py-4 rounded-full
    ${feedback} ${press} ${disabledCls}
    ${className}
  `
  if (href) {
    return <Link href={href} onClick={onClick} className={cls}>{children}</Link>
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}
