import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GarmentImage } from '@/components/garment/GarmentImage'

/**
 * One project inside a ProductGrid, always the same size: the garment photo and name, then
 * the next step, a progress line and one way back in. A finished one needs only the way back.
 */
export function ProjectCard({
  name,
  photoSrc,
  href,
  continueHref,
  nextStep,
  done,
  total,
}: {
  name: string
  /** The photo attached to the garment; see GarmentImage */
  photoSrc?: string | null
  href: string
  continueHref: string
  nextStep?: string
  done: number
  total: number
}) {
  const hasGuide = total > 0
  const finished = hasGuide && done >= total
  return (
    <article className="flex flex-col gap-3">
      <Link href={href} aria-label={`Open ${name}`} className="block rounded-(--image-radius) outline-none">
        <GarmentImage name={name} photoSrc={photoSrc} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 33vw, 100vw" className="aspect-product rounded-(--image-radius)" />
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="title-sm truncate">{name}</h3>
        {!finished && <p className="truncate text-xs text-muted-foreground">{nextStep ?? 'Guide coming soon'}</p>}
      </div>
      {hasGuide && !finished && (
        <div className="flex items-center gap-2">
          <Progress value={Math.round((done / total) * 100)} aria-label={`${name} progress`} className="flex-1" />
          <span className="text-2xs text-muted-foreground tabular-nums">{done} / {total}</span>
        </div>
      )}
      <Button variant="outline" className="mt-auto w-full" nativeButton={false} render={<Link href={hasGuide && !finished ? continueHref : href} />}>
        {finished || !hasGuide ? 'View pattern' : done === 0 ? 'Start sewing' : 'Continue'}
      </Button>
    </article>
  )
}
