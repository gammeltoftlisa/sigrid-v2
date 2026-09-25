'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { disabled as disabledCls, feedback, press } from './interaction'

interface Props {
  children: ReactNode
  onClick?: () => void
  /** Render as a link instead of wrapping the button in one (no nested interactive elements) */
  href?: string
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
  /** `warn` for confirming something destructive, e.g. restarting a project */
  tone?: 'primary' | 'warn'
}

export default function PrimaryButton({
  children,
  onClick,
  href,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = true,
  tone = 'primary',
}: Props) {
  const cls = `
    ${fullWidth ? 'w-full' : ''}
    flex items-center justify-center gap-2
    ${tone === 'warn' ? 'bg-warn hover:brightness-95' : 'bg-primary hover:bg-primary-deep'}
    text-surface text-[17px] font-semibold
    px-6 py-4 rounded-full shadow-soft
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
