'use client'

import { useId } from 'react'
import Image from 'next/image'
import { cn } from 'cn'

import { garmentPhoto, photoSrc } from '@/lib/garment-photos'

/**
 * Drawn product imagery for garments without a photo: the silhouette in a
 * fabric colourway, lit from the top left, with a fine woven texture, tonal seam
 * details and a soft ground shadow. `GarmentImage` adds a studio backdrop tinted
 * to the fabric, like a product photo.
 *
 * Colours here are content (fabric), not UI, so they live in this file rather than
 * in the design tokens.
 */

type Shape = { body: string; details: string[] }

const SHAPES: Record<string, Shape> = {
  top: {
    body: 'M30 28 L20 50 L38 52 L38 95 L82 95 L82 52 L100 50 L90 28 L74 36 Q60 42 46 36 Z',
    details: ['M46 36 Q60 30 74 36', 'M38 52 L38 58', 'M82 52 L82 58', 'M40 91 L80 91'],
  },
  skirt: {
    body: 'M38 30 L82 30 L95 95 L25 95 Z',
    details: ['M37 38 L83 38', 'M60 38 L60 50', 'M27.5 90 L92.5 90'],
  },
  trousers: {
    body: 'M32 25 L88 25 L88 55 L70 55 L65 95 L55 95 L50 55 L32 55 Z',
    details: ['M32 31 L88 31', 'M60 31 L60 52', 'M40 31 L44 40', 'M80 31 L76 40'],
  },
  hoodie: {
    body: 'M28 30 L18 55 L36 57 L36 98 L84 98 L84 57 L102 55 L92 30 L76 38 Q60 26 44 38 Z',
    details: ['M44 38 Q52 50 60 50 Q68 50 76 38', 'M46 98 L46 78 L74 78 L74 98', 'M56 50 L55 62', 'M64 50 L65 62'],
  },
  dress: {
    body: 'M45 20 Q60 16 75 20 L82 38 L92 95 L28 95 L38 38 Z',
    details: ['M45 20 L42 32', 'M75 20 L78 32', 'M38.5 38 Q60 43 81.5 38', 'M29.5 89 L90.5 89'],
  },
  outerwear: {
    body: 'M25 28 L15 55 L33 57 L33 98 L87 98 L87 57 L105 55 L95 28 L78 38 L66 30 L54 30 L42 38 Z',
    details: ['M54 30 L58 55 L60 98', 'M66 30 L62 55', 'M58 55 Q60 57 62 55', 'M64 70 L64 70.5', 'M64 80 L64 80.5'],
  },
  default: {
    body: 'M32 30 L88 30 L88 92 L32 92 Z',
    details: [],
  },
}

function shapeFor(name: string): Shape {
  const n = name.toLowerCase()
  if (/(t-shirt|tshirt|top|blouse|linen set|co-ord)/.test(n)) return SHAPES.top
  if (/(skirt|culotte)/.test(n)) return SHAPES.skirt
  if (/(trouser|pant|cargo)/.test(n)) return SHAPES.trousers
  if (n.includes('hoodie')) return SHAPES.hoodie
  if (/(dress|slip|wrap)/.test(n)) return SHAPES.dress
  if (/(blazer|coat|outerwear)/.test(n)) return SHAPES.outerwear
  return SHAPES.default
}

/** Every garment is drawn in the same undyed linen, so the grid reads as one collection */
const HOUSE_TONE = '#C9BDAA'

function mix(hex: string, target: string, amount: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const a = p(hex)
  const b = p(target)
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`
}

export function GarmentArt({ name, className }: { name: string; className?: string }) {
  const id = useId().replace(/:/g, '')
  const shape = shapeFor(name)
  const tone = HOUSE_TONE
  const light = mix(tone, '#ffffff', 0.22)
  const shade = mix(tone, '#000000', 0.14)
  const seam = mix(tone, '#000000', 0.38)

  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={name} className={cn('garment-render', className)}>
      <defs>
        <linearGradient id={`${id}-fabric`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={tone} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
        <pattern id={`${id}-weave`} width="1.4" height="1.4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="1.4" stroke="#000" strokeOpacity="0.045" strokeWidth="0.45" />
        </pattern>
        <radialGradient id={`${id}-ground`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="101" rx="38" ry="4.5" fill={`url(#${id}-ground)`} />
      <path d={shape.body} fill={`url(#${id}-fabric)`} />
      <path d={shape.body} fill={`url(#${id}-weave)`} />
      <path d={shape.body} fill="none" stroke={seam} strokeOpacity="0.55" strokeWidth="0.8" strokeLinejoin="round" />
      {shape.details.map((d) => (
        <path key={d} d={d} fill="none" stroke={seam} strokeOpacity="0.5" strokeWidth="0.7" strokeLinecap="round" />
      ))}
    </svg>
  )
}

/**
 * The garment's product photo, cropped to fill the frame. Falls back to the drawn art
 * on a flat linen backdrop for garments without a photo yet.
 * `artClassName` applies to whichever is shown (e.g. the hover zoom on product tiles).
 */
export function GarmentImage({
  name,
  className,
  artClassName,
  sizes = '(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw',
  priority,
  children,
}: {
  name: string
  className?: string
  artClassName?: string
  /** How wide the image is shown, so the browser picks the right size */
  sizes?: string
  /** Load right away (the main image on a page) */
  priority?: boolean
  children?: React.ReactNode
}) {
  const photo = garmentPhoto(name)
  return (
    <div className={cn('garment-image relative flex items-center justify-center overflow-hidden bg-muted', className)}>
      {photo ? (
        <Image
          src={photoSrc(photo)}
          alt={photo.alt}
          fill
          sizes={sizes}
          preload={priority}
          // Size limits are for the drawing; a photo always fills the frame
          className={cn('object-cover', artClassName?.replace(/(^|\s)\S*max-w-\S+/g, ''))}
        />
      ) : (
        <GarmentArt name={name} className={cn('size-full', artClassName)} />
      )}
      {children}
    </div>
  )
}
