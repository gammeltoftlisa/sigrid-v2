'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Holds on to the tallest height its content has had, so switching a filter to a
 * shorter list (or a loading state) never shrinks the page and throws you back to the top.
 * Resets when `resetKey` changes (e.g. a new page or search).
 */
export function KeepHeight({ children, resetKey, className }: { children: React.ReactNode; resetKey?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({ key: resetKey, min: 0 })
  const min = state.key === resetKey ? state.min : 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height
      setState((s) => (s.key !== resetKey ? { key: resetKey, min: h } : h > s.min ? { key: resetKey, min: h } : s))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [resetKey])

  return (
    <div style={{ minHeight: min || undefined }} className={className}>
      <div ref={ref}>{children}</div>
    </div>
  )
}
