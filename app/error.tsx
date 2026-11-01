'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { IconNeedleThread } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

/** When a page breaks: say so calmly and offer a way on. The root layout stays, so toasts and the theme still work. */
export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Empty className="bg-card max-w-md rounded-(--radius)">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconNeedleThread />
          </EmptyMedia>
          <EmptyTitle>This page didn’t open</EmptyTitle>
          <EmptyDescription>Something went wrong on our side. Your saved work is still on this device.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => retry()}>Try again</Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/home" />}>
              Go home
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </main>
  )
}
