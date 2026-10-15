'use client'

import { cn } from 'cn'

import type { StudioPattern } from '@/lib/studio/patterns'
import { WIZARD, isDone } from '@/lib/studio/wizard'

/** "Draft · 4/6" or "Ready to publish": opens the last check */
export function StatusChip({ pattern, onClick, className }: { pattern: StudioPattern; onClick: () => void; className?: string }) {
  const parts = WIZARD.filter((w) => w.id !== 'publish')
  const done = parts.filter((w) => isDone(w.id, pattern)).length
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center rounded-full bg-glass px-3 text-xs font-medium text-foreground tabular-nums transition-colors duration-150 hover:bg-card',
        pattern.status === 'ready' && 'bg-success-soft',
        className,
      )}
    >
      {pattern.status === 'ready' ? 'Ready to publish' : `Draft · ${done}/${parts.length} done`}
    </button>
  )
}
