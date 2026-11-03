import type { Metadata } from 'next'

import { NotFoundMessage } from '@/components/patterns/not-found-message'

export const metadata: Metadata = { title: 'Page not found' }

/** Any address that doesn't exist: why, and a way back in */
export default function NotFound() {
  return (
    <main>
      <NotFoundMessage
        className="min-h-svh"
        title="This page doesn’t exist"
        description="The link may be old or mistyped. Nothing of yours is affected."
      />
    </main>
  )
}
