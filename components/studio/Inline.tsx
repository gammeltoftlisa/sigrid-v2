'use client'

import { useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { cn } from 'cn'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/**
 * Write-in-place fields for the studio: they look like the text a sewer will
 * read, show a soft fill on hover, and turn white with the focus outline while
 * you type. Placeholders say what goes there.
 */
// -mx-1 + px-1: the text lines up with the text around it; the soft fill appears only on hover and while typing
const base =
  '-mx-1 w-full min-w-0 rounded-md bg-transparent px-1 py-0.5 outline-none transition-colors placeholder:text-muted-foreground hover:bg-foreground/5 focus-visible:bg-card'

export function InlineText({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  /** Accessible name, since the field has no visible label */
  label: string
  placeholder?: string
  className?: string
}) {
  return (
    <input
      aria-label={label}
      data-empty={!value}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(base, className)}
    />
  )
}

/** Grows with its text, like a paragraph */
export function InlineTextarea({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder?: string
  className?: string
}) {
  return (
    <textarea
      aria-label={label}
      data-empty={!value}
      value={value}
      rows={1}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(base, 'field-sizing-content resize-none', className)}
    />
  )
}

/**
 * A number with its unit after it. Keeps what you type (so "1," or an empty
 * field don't jump) and reports a number, or null when empty.
 */
export function InlineNumber({
  value,
  onChange,
  label,
  unit,
  placeholder,
  unitBefore,
  className,
}: {
  value: number | null
  onChange: (n: number | null) => void
  label: string
  /** Shown after the number (or before it with unitBefore) */
  unit?: string
  placeholder?: string
  /** For prices: "€12" */
  unitBefore?: boolean
  className?: string
}) {
  const [text, setText] = useState(value ? String(value) : '')
  const [last, setLast] = useState(value)
  if (value !== last) {
    setLast(value)
    if (parse(text) !== value) setText(value ? String(value) : '')
  }
  return (
    <span className={cn('inline-flex items-baseline', unitBefore ? 'gap-0' : 'gap-1', className)}>
      {unit && unitBefore && <span className="text-muted-foreground">{unit}</span>}
      <input
        aria-label={unit ? `${label} (${unit})` : label}
        data-empty={!text}
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        size={Math.max(1, (text || placeholder || '').length)}
        onChange={(e) => {
          setText(e.target.value)
          const n = parse(e.target.value)
          setLast(n)
          onChange(n)
        }}
        className={cn(base, 'mx-0 w-auto tabular-nums')}
      />
      {unit && !unitBefore && <span className="text-muted-foreground">{unit}</span>}
    </span>
  )
}

function parse(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Text that opens a small chooser when clicked, e.g. "Beginner" or "XS–XL".
 * Reads like the rest of the line; the chevron shows it can be changed.
 */
export function InlinePick({
  label,
  text,
  placeholder,
  children,
  className,
}: {
  label: string
  /** What the line shows now; empty shows the placeholder */
  text: string
  placeholder: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`${label}: ${text || 'not set'}`}
        data-empty={!text}
        className={cn(base, 'inline-flex w-auto items-center gap-0.5 text-left', !text && 'text-muted-foreground', className)}
      >
        {text || placeholder}
        <IconChevronDown className="size-3 opacity-60" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-sm gap-2 p-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {children}
      </PopoverContent>
    </Popover>
  )
}
