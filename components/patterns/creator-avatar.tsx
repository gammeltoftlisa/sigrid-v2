import { cn } from 'cn'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Creator } from '@/lib/types'

/** A creator's initial in a round sand avatar. `profile` is the big one in their ProfileHeader. */
export function CreatorAvatar({
  creator,
  size = 'default',
  className,
}: {
  creator: Pick<Creator, 'name'>
  /** profile: fills the photo spot of a ProfileHeader, as your own photo does on You */
  size?: 'sm' | 'default' | 'lg' | 'profile'
  className?: string
}) {
  if (size === 'profile') {
    return (
      <Avatar className={cn('aspect-square size-auto w-full', className)}>
        <AvatarFallback className="title-xl bg-card">{creator.name[0]}</AvatarFallback>
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
