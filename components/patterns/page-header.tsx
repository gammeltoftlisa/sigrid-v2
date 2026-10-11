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
  barActions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  /** Show a back button in the top bar. `true` goes back in history; a string navigates there. */
  back?: boolean | string
  /** Where this page sits: Home first, this page last. Shown in the sticky top bar. */
  breadcrumbs?: Crumb[]
  /** Small actions on the right of the top bar */
  barActions?: React.ReactNode
  className?: string
}) {
  return (
    <>
      {(back || breadcrumbs || barActions) && <TopBar back={back} breadcrumbs={breadcrumbs} actions={barActions} />}
      <header className={cn('flex flex-col gap-4 pt-2 pb-2 md:pt-4', className)}>
        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="max-w-prose text-base text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      </header>
    </>
  )
}

/**
 * Sticky bar at the top of a screen, like the sewing guide's header: back, breadcrumbs,
 * actions on the right. Sits edge to edge inside PageContainer.
 */
export function TopBar({
  back,
  breadcrumbs,
  actions,
  className,
}: {
  back?: boolean | string
  breadcrumbs?: Crumb[]
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'top-bar sticky top-0 z-30 -mx-4 -mb-6 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/85 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12',
        className,
      )}
    >
      {back && <BackButton to={typeof back === 'string' ? back : undefined} />}
      {breadcrumbs && <PageBreadcrumbs items={breadcrumbs} />}
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
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
