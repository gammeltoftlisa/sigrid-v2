'use client'

import { motion, type Variants } from 'motion/react'
import { cn } from 'cn'

import { useMounted } from '@/hooks/use-mounted'

/** The house easing: one curve for every movement in the app */
export const ease = [0.22, 1, 0.36, 1] as const

/** Rises in after `i` steps of the page-load cascade */
export const rise: Variants = {
  hidden: { y: 28, opacity: 0 },
  show: (i: number = 0) => ({ y: 0, opacity: 1, transition: { duration: 0.9, ease, delay: 0.12 + i * 0.1 } }),
}

/** Animate only after hydration, so server and browser render the same first frame */
export const useRevealReady = useMounted

/**
 * A headline line that wipes up from behind a mask: the signature page-load move.
 * Stack several with increasing `index` for a cascade. Reduced motion shows it at once.
 */
export function MaskedLine({ children, index = 0, className }: { children: React.ReactNode; index?: number; className?: string }) {
  const ready = useRevealReady()
  return (
    <span className={cn('mask-line', className)}>
      <motion.span
        className="block"
        initial={{ y: '110%' }}
        animate={ready ? { y: 0 } : { y: '110%' }}
        transition={{ duration: 0.95, ease, delay: 0.08 + index * 0.11 }}
      >
        {children}
      </motion.span>
    </span>
  )
}

/** Rises in as part of the page-load cascade, after the headline */
export function Rise({ index = 0, className, children }: { index?: number; className?: string; children: React.ReactNode }) {
  const ready = useRevealReady()
  return (
    <motion.div custom={index} variants={rise} initial="hidden" animate={ready ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}
