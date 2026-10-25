'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useMounted } from '@/hooks/use-mounted'
import { findPublishedGarment, isPublishedId } from '@/lib/published'

/**
 * Published studio patterns live in this browser, so a page showing one renders only once it
 * has mounted (the server can't know it), and says so plainly if it isn't published any more.
 */
export function PublishedGate({ id, children }: { id: string; children: React.ReactNode }) {
  const mounted = useMounted()
  if (!isPublishedId(id)) return children
  if (!mounted) return null
  if (!findPublishedGarment(id)) {
    return (
      <div className="mx-auto flex min-h-svh max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-4xl">This pattern isn’t <em className="display-italic">published</em></h1>
        <p className="text-base text-muted-foreground">It may have been unpublished, or it was published in another browser.</p>
        <Button variant="outline" className="mt-2" nativeButton={false} render={<Link href="/explore" />}>
          Go to Explore
        </Button>
      </div>
    )
  }
  return children
}
