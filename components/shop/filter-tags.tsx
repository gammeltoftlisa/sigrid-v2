'use client'

import { IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

import { Swatch } from './filter-dropdown'

export interface FilterTag {
  /** Unique among the tags */
  id: string
  label: string
  /** For colours: the dot in front of the name */
  swatch?: { value: string; hex?: string }
  onRemove: () => void
}

/** What's filtered on, above the products: press a tag to remove it. Nothing shows when nothing is chosen. */
export function FilterTags({ tags, onClear }: { tags: FilterTag[]; onClear: () => void }) {
  if (tags.length === 0) return null
  return (
    <div role="group" aria-label="Chosen filters" className="flex flex-wrap items-center gap-2 pb-3">
      {tags.map((tag) => (
        <Button key={tag.id} variant="outline" size="sm" aria-label={`Remove filter: ${tag.label}`} onClick={tag.onRemove}>
          {tag.swatch && <Swatch option={tag.swatch} />}
          {tag.label}
          <IconX data-icon="inline-end" aria-hidden />
        </Button>
      ))}
      {tags.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear all
        </Button>
      )}
    </div>
  )
}
