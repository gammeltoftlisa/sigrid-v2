import { cn } from 'cn'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Creator } from '@/lib/types'

/** A creator's initial in a round sand avatar. xl is the big one on a profile header (white, on glass). */
export function CreatorAvatar({
  creator,
  size = 'default',
  className,
}: {
  creator: Pick<Creator, 'name'>
  /** xl: the big avatar on a profile header */
  size?: 'sm' | 'default' | 'lg' | 'xl'
  className?: string
}) {
  if (size === 'xl') {
    return (
      <Avatar className={cn('size-20 md:size-24', className)}>
        <AvatarFallback className="bg-card text-3xl font-medium md:text-4xl">{creator.name[0]}</AvatarFallback>
      </Avatar>
    )
  }
  return (
    <Avatar size={size} className={className}>
      {/* Sand, so it shows on white rows and cards */}
      <AvatarFallback className="bg-glass font-medium text-foreground">{creator.name[0]}</AvatarFallback>
    </Avatar>
  )
}
