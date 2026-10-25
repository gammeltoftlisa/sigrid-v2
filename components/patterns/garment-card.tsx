import Link from 'next/link'
import { cn } from 'cn'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { GarmentImage } from '@/components/garment/GarmentArt'
import type { Difficulty } from '@/lib/types'
import { PhotoLabel } from '@/components/patterns/photo-label'

/**
 * A garment or creator pattern in a grid, styled like a store tile.
 * Portrait image → name (small caps) → one quiet detail line → price.
 * The whole tile is one link. Progress replaces the price for started projects.
 */
export function GarmentCard({
  href,
  name,
  difficulty,
  time,
  price,
  byline,
  progress,
  tag,
  lead,
  description,
  className,
}: {
  href: string
  name: string
  difficulty: Difficulty
  time?: string
  price?: number
  byline?: string
  /** 0–100, only for started projects */
  progress?: number
  /** Small label over the image, e.g. "In progress" */
  tag?: string
  /** The featured tile at the start of a grid: twice as wide and tall, with the description */
  lead?: boolean
  /** Shown on the lead tile only */
  description?: string
  className?: string
}) {
  const details = [difficulty, time].filter(Boolean).join(' · ')
  return (
    <Card
      data-variant="product"
      className={cn('group/tile relative gap-3 pt-0', lead && 'tile-lead', className)}
    >
      <GarmentImage
        name={name}
        sizes={lead ? '(min-width: 1280px) 40vw, (min-width: 768px) 60vw, 100vw' : undefined}
        className="product-image aspect-product p-6 sm:p-8"
        artClassName={cn('hover-zoom', lead ? 'max-w-72' : 'max-w-40')}
      >
        {tag && (
          <PhotoLabel className="absolute top-3 left-3">{tag}</PhotoLabel>
        )}
      </GarmentImage>
      <CardHeader className="gap-0.5">
        {lead && <p className="kicker">Featured pattern</p>}
        <CardTitle>
          <Link href={href} className="outline-none after:absolute after:inset-0">
            {name}
          </Link>
        </CardTitle>
        {byline && <p className="truncate text-xs">{byline}</p>}
        {lead && description && <p className="line-clamp-2 max-w-md text-sm text-muted-foreground">{description}</p>}
        <p className="line-clamp-1 text-xs text-muted-foreground">{details}</p>
        {progress !== undefined ? (
          <div className="mt-1 flex items-center gap-2">
            <Progress value={progress} aria-label={`${name} progress`} className="flex-1" />
            <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
          </div>
        ) : (
          price !== undefined && <p className="mt-1 text-sm tabular-nums">€{price}</p>
        )}
      </CardHeader>
    </Card>
  )
}
