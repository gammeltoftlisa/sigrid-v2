import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GarmentImage } from '@/components/garment/GarmentImage'

/**
 * One project in progress, inside a ProductGrid:
 * the garment photo, its name, the next step, a progress line and "Continue sewing".
 */
export function ProjectCard({
  name,
  photoSrc,
  href,
  continueHref,
  sizeLabel,
  nextStep,
  done,
  total,
}: {
  name: string
  /** The photo attached to the garment; see GarmentImage */
  photoSrc?: string | null
  href: string
  continueHref: string
  sizeLabel: string
  nextStep?: string
  done: number
  total: number
}) {
  const finished = total > 0 && done >= total
  const percent = total ? Math.round((done / total) * 100) : 0
  return (
    <article className="flex flex-col gap-3">
      <Link href={href} className="block outline-none rounded-(--image-radius)">
        <GarmentImage name={name} photoSrc={photoSrc} sizes="(min-width: 1280px) 18vw, (min-width: 768px) 30vw, 50vw" className="aspect-cover rounded-(--image-radius)" />
      </Link>
      <div className="flex flex-col gap-0.5 px-1">
        <Link href={href} className="truncate text-sm font-medium outline-none hover:underline hover:underline-offset-4">
          {name}
        </Link>
        <span className="truncate text-xs text-muted-foreground">{finished ? 'Finished' : nextStep ? `Next: ${nextStep}` : 'Ready to start'}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{sizeLabel}</span>
        <div className="mt-2 flex items-center gap-2">
          <Progress value={percent} aria-label={`${name} progress`} className="flex-1" />
          <span className="text-2xs text-muted-foreground tabular-nums">
            {done}/{total}
          </span>
        </div>
      </div>
      <Button variant="ghost" className="w-full px-1!" nativeButton={false} render={<Link href={finished ? href : continueHref} />}>
        {finished ? 'View garment' : 'Continue sewing'}
        <IconArrowRight data-icon="inline-end" />
      </Button>
    </article>
  )
}
