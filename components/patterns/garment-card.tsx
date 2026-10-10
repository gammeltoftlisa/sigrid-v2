import Link from 'next/link'
import { cn } from 'cn'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { GarmentImage } from '@/components/garment/GarmentArt'
import type { Difficulty } from '@/lib/types'

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
  className?: string
}) {
  const details = [difficulty, time].filter(Boolean).join(' · ')
  return (
    <Card
      data-variant="product"
      className={cn('group/tile relative gap-3 pt-0 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50', className)}
    >
      <GarmentImage
        name={name}
        className="product-image aspect-[4/5] p-6 sm:p-8"
        artClassName="max-w-40 transition-transform duration-500 ease-out group-hover/tile:scale-[1.04]"
      >
        {tag && (
          <span className="eyebrow absolute top-3 left-3 bg-background/85 px-2 py-1 text-foreground backdrop-blur-sm">{tag}</span>
        )}
      </GarmentImage>
      <CardHeader className="gap-1">
        <CardTitle>
          <Link href={href} className="outline-none after:absolute after:inset-0">
            {name}
          </Link>
        </CardTitle>
        {byline && <p className="truncate text-sm">{byline}</p>}
        <p className="line-clamp-1 text-sm text-muted-foreground">{details}</p>
      </CardHeader>
      <CardContent>
        {progress !== undefined ? (
          <div className="flex items-center gap-2">
            <Progress value={progress} aria-label={`${name} progress`} className="flex-1" />
            <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
          </div>
        ) : (
          price !== undefined && <p className="text-sm tabular-nums">€{price}</p>
        )}
      </CardContent>
    </Card>
  )
}
