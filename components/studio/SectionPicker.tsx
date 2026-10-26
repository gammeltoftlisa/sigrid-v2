'use client'

import { useId } from 'react'
import { IconCheck } from '@tabler/icons-react'
import { cn } from 'cn'

import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SECTION_ICONS, SECTION_PRESETS, type SectionIconKey } from './section-icons'

/**
 * A section's icon, which opens a chooser: a ready-made section (title and
 * icon in one click), or your own title with any icon from the set.
 */
export function SectionPicker({
  title,
  icon,
  open,
  onOpenChange,
  onChange,
}: {
  title: string
  icon: SectionIconKey
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (next: { title?: string; icon?: SectionIconKey }) => void
}) {
  const titleId = useId()
  const Current = SECTION_ICONS[icon].Icon

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        aria-label={`Section icon and title: ${title}. Change`}
        title="Change icon and title"
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-glass text-foreground transition-colors hover:bg-primary hover:text-primary-foreground aria-expanded:bg-primary aria-expanded:text-primary-foreground"
      >
        <Current size={15} aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-4 p-3">
        <div className="flex flex-col gap-1">
          <p className="px-1 text-xs font-medium text-muted-foreground">Ready-made</p>
          <ul className="flex flex-col">
            {SECTION_PRESETS.map((p) => {
              const P = SECTION_ICONS[p.icon].Icon
              const chosen = p.title === title && p.icon === icon
              return (
                <li key={p.title}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ title: p.title, icon: p.icon })
                      onOpenChange(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted">
                      <P size={15} aria-hidden />
                    </span>
                    <span className="flex-1">{p.title}</span>
                    {chosen && <IconCheck className="size-4" aria-label="Chosen" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={titleId} className="px-1 text-xs font-medium text-muted-foreground">
            Your own
          </label>
          <Input id={titleId} value={title} placeholder="Section title, e.g. Sew the pockets" onChange={(e) => onChange({ title: e.target.value })} />
          <div role="group" aria-label="Icon" className="grid grid-cols-7 gap-1">
            {(Object.keys(SECTION_ICONS) as SectionIconKey[]).map((key) => {
              const { Icon, label } = SECTION_ICONS[key]
              const on = key === icon
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={label}
                  aria-pressed={on}
                  title={label}
                  onClick={() => onChange({ icon: key })}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-md transition-colors',
                    on ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-glass',
                  )}
                >
                  <Icon size={16} aria-hidden />
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
