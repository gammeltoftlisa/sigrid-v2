import Link from 'next/link'

import { GarmentImage } from '@/components/garment/GarmentArt'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import type { Creator, Pattern } from '@/lib/types'

/**
 * A pattern maker as a white card: two of their patterns as a cover, the avatar overlapping it,
 * then handle, one line of bio and how many patterns they have. The whole card links to their page.
 */
export function MakerCard({ creator, patterns }: { creator: Creator; patterns: Pattern[] }) {
  const cover = patterns.slice(0, 2)
  return (
    <Link
      href={`/creator/${creator.id}`}
      className="group/maker flex flex-col overflow-hidden rounded-(--control-radius) bg-card p-2 outline-none"
    >
      <div className="grid aspect-wide grid-cols-2 gap-1 overflow-hidden rounded-(--image-radius)">
        {cover.map((p) => (
          <GarmentImage
            key={p.id}
            name={p.name}
            sizes="(min-width: 1280px) 10vw, 25vw"
            className="h-full w-full"
            artClassName="hover-zoom"
          />
        ))}
      </div>
      <div className="-mt-6 flex flex-col gap-1 px-2 pb-1">
        <CreatorAvatar creator={creator} size="lg" />
        <span className="mt-2 flex min-w-0 items-center gap-1 truncate text-sm font-medium">
          {creator.handle}
        </span>
        <span className="line-clamp-1 hidden text-xs text-muted-foreground sm:block">{creator.bio}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {patterns.length} {patterns.length === 1 ? 'pattern' : 'patterns'}
        </span>
      </div>
    </Link>
  )
}
