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
}

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = true,
}: Props) {
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
        bg-primary text-surface
        text-[17px] font-semibold
        px-6 py-4 rounded-full
        shadow-soft
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-colors duration-200
        active:bg-primary-deep
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
