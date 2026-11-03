import Link from 'next/link'
import { IconNeedleThread } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

/**
 * When what a link points to isn't there: say what's missing, the likely reason, and where to go instead.
 * Never show something else in its place.
 */
export function NotFoundMessage({
  title,
  description,
  action = { label: 'Go to Explore', href: '/explore' },
  className,
}: {
  title: string
  description: string
  action?: { label: string; href: string }
  className?: string
}) {
  return (
    <div className={cn('flex min-h-[70svh] items-center justify-center p-4', className)}>
      <Empty className="border max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconNeedleThread />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button nativeButton={false} render={<Link href={action.href} />}>{action.label}</Button>
            {action.href !== '/home' && (
              <Button variant="outline" nativeButton={false} render={<Link href="/home" />}>Go home</Button>
            )}
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
