import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Creator } from '@/lib/types'

/** Neutral initial avatar for a creator (no brand colours until branding is decided). */
export function CreatorAvatar({
  creator,
  size = 'default',
  className,
}: {
  creator: Pick<Creator, 'name'>
  size?: 'sm' | 'default' | 'lg'
  className?: string
}) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback>{creator.name[0]}</AvatarFallback>
    </Avatar>
  )
}
