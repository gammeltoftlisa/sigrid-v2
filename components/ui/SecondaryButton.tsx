'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
  variant?: 'outline' | 'ghost'
}

export default function SecondaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = true,
  variant = 'outline',
}: Props) {
  const variantClasses =
    variant === 'outline'
      ? 'border border-rim bg-surface text-ink'
      : 'bg-transparent text-ink-2'

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`
        ${fullWidth ? 'w-full' : ''}
        flex items-center justify-center gap-2
        ${variantClasses}
        text-[17px] font-medium
        px-6 py-4 rounded-full
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
