'use client'

import { cn } from 'cn'

import { TodoMark } from './Inline'
import { todoItems } from './TodoBar'

import type { StudioPattern } from '@/lib/studio/patterns'

/** "• 4 to fill in", "All filled in · Publish" or "Published": opens the last check */
export function StatusChip({ pattern, onClick, className }: { pattern: StudioPattern; onClick: () => void; className?: string }) {
  const left = todoItems(pattern).length
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center rounded-full bg-glass px-3 text-xs font-medium text-foreground tabular-nums transition-colors duration-150 hover:bg-card',
        pattern.publishedAt && 'bg-success-soft',
        className,
      )}
    >
      {pattern.publishedAt ? 'Published' : left === 0 ? 'All filled in · Publish' : <TodoMark>{`${left} to fill in`}</TodoMark>}
    </button>
  )
}
