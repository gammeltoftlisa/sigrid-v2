import Link from 'next/link'

import { GarmentImage } from '@/components/garment/GarmentImage'
import { CreatorAvatar } from '@/components/patterns/creator-avatar'
import type { Creator, Pattern } from '@/lib/types'

/**
 * A pattern maker inside a ProductGrid. The person comes first: avatar, name, what they make and how
 * many patterns they have, then a few of those patterns. The whole card links to their page.
 */
export function MakerCard({ creator, patterns }: { creator: Creator; patterns: Pattern[] }) {
  return (
    <Link href={`/creator/${creator.id}`} className="group/maker flex flex-col gap-4 outline-none">
      <div className="flex items-center gap-3">
        <CreatorAvatar creator={creator} size="lg" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-heading text-xl">{creator.name}</span>
          <span className="truncate text-xs text-muted-foreground">{creator.handle}</span>
        </div>
      </div>
      <p className="line-clamp-2 min-h-11 text-sm text-muted-foreground">{creator.bio}</p>
      <div className="grid grid-cols-3 gap-1">
        {patterns.slice(0, 3).map((p) => (
          <GarmentImage
            key={p.id}
            name={p.name}
            sizes="(min-width: 1024px) 10vw, 30vw"
            className="aspect-product rounded-(--image-radius)"
            imageClassName="hover-zoom"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {patterns.length} {patterns.length === 1 ? 'pattern' : 'patterns'}
      </span>
    </Link>
  )
}
