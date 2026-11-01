'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IconPhotoOff } from '@tabler/icons-react'
import { cn } from 'cn'

import { garmentPhoto } from '@/lib/garment-photos'

/**
 * The garment's photo, cropped to fill the frame, the same wherever the garment is shown.
 * With no photo, or one that won't load, it shows a plain "no photo" icon. Never a drawn stand-in.
 * `imageClassName` applies to the photo (e.g. the hover zoom on product tiles).
 */
export function GarmentImage({
  name,
  className,
  imageClassName,
  sizes = '(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw',
  priority,
  photoSrc: ownPhoto,
  children,
}: {
  name: string
  /**
   * The photo attached to this garment (`garment.photo`): always pass it when you have it.
   * Left out, built-in garments use their catalogue photo. `null` means this garment has no photo
   * of its own and must not borrow one, as with a maker's pattern.
   */
  photoSrc?: string | null
  className?: string
  imageClassName?: string
  /** How wide the image is shown, so the browser picks the right size */
  sizes?: string
  /** Load right away (the main image on a page) */
  priority?: boolean
  children?: React.ReactNode
}) {
  const stock = ownPhoto === undefined ? garmentPhoto(name) : null
  const src = ownPhoto ?? stock?.src ?? null
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  return (
    <div className={cn('garment-image relative flex items-center justify-center overflow-hidden bg-muted', className)}>
      {src && src !== failedSrc ? (
        <Image
          src={src}
          alt={stock?.alt ?? name}
          fill
          sizes={sizes}
          preload={priority}
          onError={() => setFailedSrc(src)}
          className={cn('object-cover', imageClassName)}
        />
      ) : (
        <IconPhotoOff role="img" aria-label={`${name}: no photo yet`} className="size-6 text-muted-foreground" stroke={1.5} />
      )}
      {children}
    </div>
  )
}
