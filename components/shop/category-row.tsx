'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from 'cn'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

const EDGE = 2

/**
 * Categories on one line. When they don't fit they fade out at the edge, and you can swipe or scroll sideways,
 * or press the arrows floating over the ends; touch screens just swipe. The category you're in is brought into view.
 * With `products` it holds cards instead, sized by the cards-per-row rule, and doesn't fade over the photos.
 */
export function CategoryRow({ label, products, children }: { label: string; products?: boolean; children: React.ReactNode }) {
  const row = useRef<HTMLElement>(null)
  const [more, setMore] = useState({ left: false, right: false })

  useEffect(() => {
    const el = row.current
    if (!el) return
    const measure = () => setMore({ left: el.scrollLeft > EDGE, right: el.scrollLeft + el.clientWidth < el.scrollWidth - EDGE })
    const current = el.querySelector<HTMLElement>('[aria-current="page"]')
    // Only this row moves: scrollIntoView would also move the area around it
    if (current && (current.offsetLeft < el.scrollLeft || current.offsetLeft + current.offsetWidth > el.scrollLeft + el.clientWidth)) {
      el.scrollLeft = current.offsetLeft - 48
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    el.addEventListener('scroll', measure, { passive: true })
    return () => {
      observer.disconnect()
      el.removeEventListener('scroll', measure)
    }
  }, [children])

  const go = (direction: 1 | -1) => {
    const el = row.current
    if (!el) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: still ? 'auto' : 'smooth' })
  }

  // The row fades softly at an end where there's more to see
  const fade = products ? undefined : ({ '--fade-left': more.left ? '4rem' : '0rem', '--fade-right': more.right ? '4rem' : '0rem' } as React.CSSProperties)
  const where = label.toLowerCase()
  return (
    <div className="relative">
      <div ref={row as React.RefObject<HTMLDivElement>} role={products ? 'group' : 'navigation'} aria-label={label} className={products ? 'tiles-row' : 'category-row'} style={fade}>
        {children}
      </div>
      {more.left && (
        <div className={cn('absolute inset-y-0 left-0 z-10 flex items-center pointer-coarse:hidden', products && 'pl-2')}>
          <Button variant="outline" size="icon-lg" aria-label={`Scroll ${where} left`} className="category-arrow rounded-full" onClick={() => go(-1)}>
            <IconChevronLeft />
          </Button>
        </div>
      )}
      {more.right && (
        <div className={cn('absolute inset-y-0 right-0 z-10 flex items-center pointer-coarse:hidden', products && 'pr-2')}>
          <Button variant="outline" size="icon-lg" aria-label={`Scroll ${where} right`} className="category-arrow rounded-full" onClick={() => go(1)}>
            <IconChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
}
