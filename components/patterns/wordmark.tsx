import Image from 'next/image'
import { cn } from 'cn'

import needleSmall from '@/public/brand/needle-small.png'
import needle from '@/public/brand/needle.png'

/**
 * The needle bent into an S: the polished metal photo, with a see-through eye so it sits on any background.
 * `small` is a sturdier cut of it for text sizes, where the real needle's thin line would nearly vanish.
 */
export function NeedleMark({ small, className }: { small?: boolean; className?: string }) {
  return <Image src={small ? needleSmall : needle} alt="" sizes="96px" className={cn('w-auto', className)} />
}

/** "Sigrid" with the needle as its S. Sized by the parent font size. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Sigrid" className={cn('wordmark', className)}>
      <NeedleMark small className="wordmark-needle" />
      <span aria-hidden>igrid</span>
    </span>
  )
}

/** The rail's mark: the needle on its own. */
export function Logomark({ className }: { className?: string }) {
  return <NeedleMark small className={cn('h-8', className)} />
}
