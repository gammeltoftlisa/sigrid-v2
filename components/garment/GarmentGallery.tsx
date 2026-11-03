'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { GarmentImage } from './GarmentImage'

/**
 * A pattern's photos, one at a time: swipe them on a phone or trackpad, or use the arrows that
 * show on hover. Dots say how many there are and which one you're on. With one photo (or none)
 * it's simply that photo, as GarmentImage. In a card, pass `href` so a tap on the photo still opens
 * the pattern while a swipe moves through the photos.
 */
export function GarmentGallery({
  name,
  photoSrc,
  photos,
  href,
  className,
  imageClassName,
  sizes,
  priority,
  onIndexChange,
  show,
  children,
}: {
  name: string
  /** The cover photo, as for GarmentImage */
  photoSrc?: string | null
  /** Every photo, the cover first (`garment.photos`) */
  photos?: string[]
  /** In a card: where tapping a photo goes */
  href?: string
  className?: string
  imageClassName?: string
  sizes?: string
  priority?: boolean
  /** Told which photo is showing, e.g. so the studio can remove that one */
  onIndexChange?: (index: number) => void
  /** Turn to this photo when it changes, e.g. the one of a colour just chosen */
  show?: number
  /** Labels and controls over the photo, placed with absolute classes */
  children?: React.ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const el = track.current
    if (!el || show === undefined || show < 0) return
    el.scrollTo({ left: show * el.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [show])

  if (!photos || photos.length < 2) {
    return (
      <GarmentImage name={name} photoSrc={photoSrc} className={className} imageClassName={imageClassName} sizes={sizes} priority={priority}>
        {children}
      </GarmentImage>
    )
  }

  const go = (to: number) => {
    const el = track.current
    if (!el) return
    const next = (to + photos.length) % photos.length
    el.scrollTo({ left: next * el.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`${name}, ${photos.length} photos`}
      className={cn('group/gallery garment-image relative overflow-hidden bg-muted', className)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1)
        if (e.key === 'ArrowLeft') go(index - 1)
      }}
    >
      {/* Above a card's link, so a swipe moves the photos; each photo links on by itself */}
      <div
        ref={track}
        className="gallery-track relative z-10"
        onScroll={(e) => {
          const el = e.currentTarget
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
          if (i !== index) {
            setIndex(i)
            onIndexChange?.(i)
          }
        }}
      >
        {photos.map((src, i) => {
          const image = (
            <GarmentImage
              name={i === 0 ? name : `${name}, photo ${i + 1}`}
              photoSrc={src}
              className="size-full"
              imageClassName={imageClassName}
              sizes={sizes}
              priority={priority && i === 0}
            />
          )
          return href ? (
            <Link key={src.slice(-40) + i} href={href} tabIndex={-1} aria-hidden={i !== index} className="block">
              {image}
            </Link>
          ) : (
            <div key={src.slice(-40) + i} aria-hidden={i !== index}>
              {image}
            </div>
          )
        })}
      </div>

      {/* Labels and controls sit above the photos; only they take clicks there */}
      {children && <div className="pointer-events-none absolute inset-0 z-20 [&>*]:pointer-events-auto">{children}</div>}

      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Previous photo"
        onClick={() => go(index - 1)}
        className="absolute top-1/2 left-2 z-20 -translate-y-1/2 invisible group-hover/gallery:visible focus-visible:visible pointer-coarse:hidden"
      >
        <IconChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Next photo"
        onClick={() => go(index + 1)}
        className="absolute top-1/2 right-2 z-20 -translate-y-1/2 invisible group-hover/gallery:visible focus-visible:visible pointer-coarse:hidden"
      >
        <IconChevronRight />
      </Button>

      <div aria-hidden className="glass-chip absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-2">
        {photos.map((src, i) => (
          <span key={src.slice(-40) + i} className="gallery-dot" data-on={i === index || undefined} />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Photo {index + 1} of {photos.length}
      </p>
    </div>
  )
}
