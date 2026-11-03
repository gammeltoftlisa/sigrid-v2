'use client'

import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { IconArrowRight, IconExternalLink, IconSearch } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'

export interface Suggestion {
  id: string
  title: string
  /** One quiet line under the title: a maker, a shop and price, how many products */
  detail?: string
  /** A small picture or icon on the left */
  media?: React.ReactNode
  href: string
  /** Opens the shop's own page in a new tab, like a product card does */
  external?: boolean
}

export interface SuggestionGroup {
  label: string
  items: Suggestion[]
}

/** The typed words, in bold wherever they appear in a title */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (words.length === 0) return <>{text}</>
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        words.some((w) => new RegExp(`^${w}$`, 'i').test(part)) ? (
          <mark key={i} className="search-hit">{part}</mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

/**
 * A search field that suggests as you type, like a store's: from the first letter, a container opens under the
 * field with what matches, in groups, each with a picture. Arrow keys move through them, Enter opens one (or
 * searches everything when none is chosen), Escape closes. It's an ARIA combobox, so screen readers follow along.
 */
export function SearchSuggest({
  value,
  onValueChange,
  onSubmit,
  groups,
  loading = false,
  failed = false,
  onRetry,
  label,
  placeholder,
  seeAll = true,
}: {
  value: string
  onValueChange: (value: string) => void
  /** Search everything for these words: Enter with nothing chosen, or "See all results" */
  onSubmit: (value: string) => void
  groups: SuggestionGroup[]
  /** Suggestions are on their way (a server search) */
  loading?: boolean
  /** The suggestions couldn't be fetched */
  failed?: boolean
  onRetry?: () => void
  label: string
  placeholder: string
  /** Show the "See all results" row */
  seeAll?: boolean
}) {
  const router = useRouter()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  // Closed with Escape or after choosing, until the words change again
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [active, setActive] = useState(-1)
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setActive(-1)
  }

  const query = value.trim()
  const open = focused && query.length > 0 && dismissed !== value

  // The container lives at the end of the page, not inside the bar: glass inside glass can't blur what's behind it.
  // It follows the field as the page scrolls or resizes, and stays within the screen.
  const wrapRef = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<{ top: number; left: number; width: number } | null>(null)
  useEffect(() => {
    if (!open) return
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = wrapRef.current?.getBoundingClientRect()
        if (!r) return
        const vw = document.documentElement.clientWidth
        const width = Math.min(Math.max(r.width, 352), vw - 16)
        setPlace({ top: r.bottom + 8, left: Math.max(8, Math.min(r.left, vw - width - 8)), width })
      })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open])
  const items = groups.flatMap((g) => g.items)
  const total = items.length + (seeAll ? 1 : 0)
  const optionId = (i: number) => `${listId}-option-${i}`

  const go = (s: Suggestion) => {
    setDismissed(value)
    inputRef.current?.blur()
    if (s.external) window.open(s.href, '_blank', 'noopener')
    else router.push(s.href)
  }
  const submit = () => {
    setDismissed(value)
    onSubmit(query)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && open && total > 0) {
      e.preventDefault()
      setActive((i) => (i + 1) % total)
    } else if (e.key === 'ArrowUp' && open && total > 0) {
      e.preventDefault()
      setActive((i) => (i <= 0 ? total - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && active >= 0 && active < items.length) go(items[active])
      else submit()
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setDismissed(value)
    }
  }

  let index = -1
  return (
    <div ref={wrapRef} className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <InputGroup>
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            type="search"
            role="combobox"
            aria-label={label}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            autoComplete="off"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onValueChange(e.target.value)
              if (!e.target.value) onSubmit('')
            }}
            onFocus={() => {
              setFocused(true)
              setDismissed(null)
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
          />
          {loading && open && (
            <InputGroupAddon align="inline-end">
              <Spinner />
            </InputGroupAddon>
          )}
        </InputGroup>
      </form>

      {open && place && createPortal(
        // Pressing inside doesn't blur the field, so a click lands on what was pressed
        <div className="search-suggest glass-menu" style={place} onMouseDown={(e) => e.preventDefault()}>
          <div id={listId} role="listbox" aria-label={`Suggestions for ${query}`} className="flex flex-col gap-3">
            {failed ? (
              <div className="flex items-center justify-between gap-3 px-2 py-1.5">
                <p className="text-sm text-muted-foreground">Couldn’t look that up just now. This is usually a connection problem.</p>
                {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
              </div>
            ) : items.length === 0 && !loading ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">Nothing matches “{query}” yet. Try another word.</p>
            ) : (
              groups
                .filter((g) => g.items.length > 0)
                .map((g) => (
                  <div key={g.label} role="group" aria-label={g.label} className="flex flex-col gap-0.5">
                    <p className="eyebrow px-2 pb-1 text-muted-foreground">{g.label}</p>
                    {g.items.map((s) => {
                      index++
                      const i = index
                      return (
                        <div
                          key={s.id}
                          id={optionId(i)}
                          role="option"
                          aria-selected={active === i}
                          data-highlighted={active === i || undefined}
                          className="menu-option flex cursor-pointer items-center gap-3 rounded-(--control-radius) px-2 py-1.5"
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(s)}
                        >
                          {s.media && <span className="search-media shrink-0">{s.media}</span>}
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="search-title truncate text-sm"><Highlight text={s.title} query={query} /></span>
                            {s.detail && <span className="truncate text-xs text-muted-foreground">{s.detail}</span>}
                          </span>
                          {s.external && <IconExternalLink className="size-4 shrink-0 text-muted-foreground" aria-label="Opens the shop" />}
                        </div>
                      )
                    })}
                  </div>
                ))
            )}
            {seeAll && !failed && (
              <div
                id={optionId(items.length)}
                role="option"
                aria-selected={active === items.length}
                data-highlighted={active === items.length || undefined}
                className={cn('search-see-all menu-option flex cursor-pointer items-center justify-between gap-3 rounded-(--control-radius) border-t border-dashed px-2 py-2 text-sm font-medium', items.length === 0 && 'border-t-0')}
                onMouseEnter={() => setActive(items.length)}
                onClick={submit}
              >
                See all results for “{query}”
                <IconArrowRight className="size-4" aria-hidden />
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
