import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

/** Shown when a studio link points at a pattern this browser doesn't have. */
export function PatternMissing() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>This pattern isn’t here</EmptyTitle>
          <EmptyDescription>It may have been deleted, or it was made in another browser.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/studio" />}>
            Go to the studio
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
