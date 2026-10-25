'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { IconLeaf } from '@tabler/icons-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GarmentImage } from '@/components/garment/GarmentArt'
import type { FabricChoice } from '@/lib/fabric/needs'

/** A small photo of the garment, linking back to its page. Sits in front of the garment field. */
export function GarmentThumb({ id, name, photoSrc }: { id: string; name: string; photoSrc?: string }) {
  return (
    <Link href={`/garment/${id}`} aria-label={`${name}: open the garment`} className="group/tile shrink-0 rounded-(--image-radius) outline-none">
      <GarmentImage name={name} photoSrc={photoSrc} sizes="64px" className="garment-thumb rounded-(--image-radius)" artClassName="max-w-8 hover-zoom" />
    </Link>
  )
}

const ALL = 'all'

/**
 * The fabrics a garment's pattern recommends, as one row of chips: all of them, or one.
 * Short on purpose: one chip row (scrolls sideways on phones), and a single line saying
 * why the chosen fabric suits the garment, only when one is chosen.
 */
export function FabricChoices({
  choices,
  value,
  onValueChange,
  counts,
}: {
  choices: FabricChoice[]
  /** A choice id, or null for every recommended fabric ("All") */
  value: string | null
  onValueChange: (id: string | null) => void
  /** Listings per choice id, plus `all` */
  counts?: Record<string, number>
}) {
  const chosen = choices.find((c) => c.id === value)
  const count = (id: string) => counts?.[id] !== undefined && <span className="chip-count ml-1 tabular-nums">{counts[id]}</span>
  // Phones scroll the chip row: keep the chosen chip in view (it can be off to the right after a reload)
  const row = useRef<HTMLDivElement>(null)
  const countsKey = counts ? Object.values(counts).join() : ''
  useEffect(() => {
    const el = row.current
    const chip = el?.querySelector<HTMLElement>('[data-pressed]')
    if (!el || !chip || el.scrollWidth <= el.clientWidth) return
    const over = chip.getBoundingClientRect().right - el.getBoundingClientRect().right
    const under = el.getBoundingClientRect().left - chip.getBoundingClientRect().left
    if (over > 0) el.scrollBy({ left: over + 24, behavior: 'smooth' })
    else if (under > 0) el.scrollBy({ left: -(under + 16), behavior: 'smooth' })
    // Again once the counts arrive, because they make the chips wider
  }, [value, countsKey])
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <ToggleGroup
        aria-label="Recommended fabrics"
        variant="outline"
        spacing={2}
        value={[value ?? ALL]}
        onValueChange={(next) => next[0] && onValueChange(next[0] === ALL ? null : (next[0] as string))}
        ref={row}
        className="fabric-choices scroll-row flex w-full overflow-x-auto"
      >
        <ToggleGroupItem value={ALL} data-shape="tile" className="shrink-0" aria-label="All recommended fabrics">
          All{count(ALL)}
        </ToggleGroupItem>
        {choices.map((c) => (
          <ToggleGroupItem key={c.id} value={c.id} data-shape="tile" className="shrink-0" aria-label={`${c.name}, ${c.ease}${c.isEco ? ', lower-impact choice' : ''}`}>
            {c.isEco && <IconLeaf data-icon="inline-start" aria-hidden />}
            {c.name}
            {count(c.id)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {chosen && (
        <p className="line-clamp-2 px-1 text-xs text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground">{chosen.ease}.</span> {chosen.why}
        </p>
      )}
    </div>
  )
}
