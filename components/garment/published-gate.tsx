'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { NotFoundMessage } from '@/components/patterns/not-found-message'
import { isCatalogGarment } from '@/lib/data'
import { useMounted } from '@/hooks/use-mounted'
import { findPublishedGarment, isPublishedId } from '@/lib/published'

/**
 * Published studio patterns live in this browser, so a page showing one renders only once it
 * has mounted (the server can't know it), and says so plainly if it isn't published any more.
 * A link to a pattern that doesn't exist at all says so too, instead of showing another pattern.
 */
export function PublishedGate({ id, children }: { id: string; children: React.ReactNode }) {
  const mounted = useMounted()
  if (!isPublishedId(id)) {
    if (isCatalogGarment(id)) return children
    return (
      <NotFoundMessage
        title="This pattern doesn’t exist"
        description="The link may be old or mistyped, or the pattern was taken down. Your own patterns and progress aren’t affected."
      />
    )
  }
  if (!mounted) return null
  if (!findPublishedGarment(id)) {
    return (
      <div className="mx-auto flex min-h-svh max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="title-compact">This pattern isn’t <em className="display-italic">published</em></h1>
        <p className="text-base text-muted-foreground">It may have been unpublished, or it was published in another browser.</p>
        <Button variant="outline" className="mt-2" nativeButton={false} render={<Link href="/explore" />}>
          Go to Explore
        </Button>
      </div>
    )
  }
  return children
}
