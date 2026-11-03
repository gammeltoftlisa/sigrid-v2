'use client'

import { LayoutGroup, MotionConfig } from 'motion/react'

/**
 * App-wide motion settings: follow the user's "reduce motion" preference everywhere. One LayoutGroup for the
 * whole app, so a shared marker (the rail's, the tab bar's) glides between pages even when their frame remounts.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id="app">{children}</LayoutGroup>
    </MotionConfig>
  )
}
