'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  isOpen: boolean
  onClose?: () => void
  children: ReactNode
  title?: string
  showHandle?: boolean
  className?: string
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  showHandle = true,
  className = '',
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {onClose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px]"
              onClick={onClose}
            />
          )}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[28px] shadow-modal ${className}`}
          >
            {showHandle && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-rim" />
              </div>
            )}
            {title && (
              <div className="px-6 pt-2 pb-1">
                <h3 className="text-heading font-semibold text-ink">{title}</h3>
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
