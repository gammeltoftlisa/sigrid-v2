'use client'

import { MotionConfig } from 'motion/react'

/** App-wide motion settings: follow the user's "reduce motion" preference everywhere. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
