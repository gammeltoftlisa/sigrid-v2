'use client'

import { Button } from '@/components/ui/button'
import type { StudioPattern } from '@/lib/studio/patterns'
import { missingFor } from '@/lib/studio/wizard'
import { TodoMark } from './Inline'

type Target = { field: string } | { open: 'sizes' | 'pieces' | 'guide' }
type Item = { label: string; target: Target }

/** What's still missing, in the order a maker meets it on the page, and where each one is */
export function todoItems(p: StudioPattern): Item[] {
  const items: Item[] = []
  const add = (label: string, target: Target) => items.push({ label, target })
  const basics = missingFor('basics', p)
  if (basics.includes('a name')) add('Name', { field: 'name' })
  if (basics.includes('a price')) add('Price', { field: 'price' })
  const describe = missingFor('describe', p)
  if (describe.includes('the sewing time')) add('Sewing time', { field: 'time' })
  if (describe.includes('a description')) add('Description', { field: 'description' })
  if (missingFor('materials', p).length) add('Fabric', { field: 'fabric' })
  const sizes = missingFor('sizes', p)
  if (sizes.length) add(p.sizes.length === 0 ? 'Sizes' : 'Size measurements', { open: 'sizes' })
  if (missingFor('pieces', p).length) add(p.pieces.length === 0 ? 'Pattern pieces' : 'Piece measurements', { open: 'pieces' })
  if (missingFor('guide', p).length) add(p.steps.length === 0 ? 'Sewing steps' : 'Unfinished steps', { open: 'guide' })
  return items
}

/**
 * "Still to fill in": every missing part as a chip that takes you to it, and one line
 * saying what the brown dashed lines on the page mean. Hidden once everything is filled in.
 */
export function TodoBar({
  pattern,
  onOpen,
}: {
  pattern: StudioPattern
  onOpen: (what: 'sizes' | 'pieces' | 'guide') => void
}) {
  const items = todoItems(pattern)
  if (items.length === 0) return null

  const go = (t: Target) => {
    if ('open' in t) return onOpen(t.open)
    const el = document.querySelector<HTMLElement>(`[data-todo="${t.field}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el?.focus({ preventScroll: true })
  }

  return (
    <section aria-label="Still to fill in" className="todo-bar flex flex-col gap-2 rounded-(--control-radius) px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <TodoMark>{items.length === 1 ? '1 thing still to fill in' : `${items.length} things still to fill in`}</TodoMark>
        <span className="hidden text-xs text-muted-foreground sm:block">Brown dashed lines mark them on the page</span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <li key={it.label}>
            <Button variant="outline" size="xs" onClick={() => go(it.target)}>
              {it.label}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
