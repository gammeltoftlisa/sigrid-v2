'use client'

import { useRouter } from 'next/navigation'
import { IconArrowLeft } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { PageBreadcrumbs, type Crumb } from '@/components/patterns/page-breadcrumbs'

/**
 * Top of a screen. Tab screens: big title + optional description and action.
 * Sub-screens (`back`): a back button above the title.
 */
export function PageHeader({
  title,
  description,
  action,
  back,
  breadcrumbs,
  className,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  /** Show a back button. `true` goes back in history; a string navigates there. */
  back?: boolean | string
  /** Where this page sits: Home first, this page last */
  breadcrumbs?: Crumb[]
  className?: string
}) {
  return (
    <header className={cn('flex flex-col gap-4 pt-6 pb-2 md:pt-10', className)}>
      {(back || breadcrumbs) && (
        <div className="flex min-w-0 items-center gap-2">
          {back && <BackButton to={typeof back === 'string' ? back : undefined} />}
          {breadcrumbs && <PageBreadcrumbs items={breadcrumbs} />}
        </div>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="max-w-prose text-base text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}

/** Ghost icon button that goes back in history, or to `to` when given. */
export function BackButton({ to, className }: { to?: string; className?: string }) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label="Back"
      className={cn('-ml-2', className)}
      onClick={() => (to ? router.push(to) : router.back())}
    >
      <IconArrowLeft />
    </Button>
  )
}

/** Page padding for screens inside the app shell. Fills the width beside the sidebar; pass a max-w class for reading pages. */
export function PageContainer({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('page mx-auto flex w-full flex-col gap-8 px-4 pb-10 sm:px-6', className)} {...props} />
}
