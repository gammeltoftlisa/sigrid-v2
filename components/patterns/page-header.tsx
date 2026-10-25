'use client'

import { useRouter } from 'next/navigation'
import { IconArrowLeft } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { PageBreadcrumbs, type Crumb } from '@/components/patterns/page-breadcrumbs'
import { MaskedLine, Rise } from '@/components/patterns/reveal'

/**
 * Top of a screen. Tab screens: big display title + optional kicker, description and action.
 * Sub-screens (`back`): a back button above the title. The title wipes in from behind a mask.
 */
export function PageHeader({
  kicker,
  title,
  description,
  action,
  back,
  breadcrumbs,
  barActions,
  className,
}: {
  /** Small mono label above the title */
  kicker?: React.ReactNode
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
      <header className={cn('page-header flex flex-col pt-4', className)}>
        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-4">
            {kicker && (
              <Rise>
                <p className="kicker">{kicker}</p>
              </Rise>
            )}
            <h1>
              <MaskedLine>{title}</MaskedLine>
            </h1>
            {description && (
              <Rise index={1}>
                <p className="max-w-prose text-base text-muted-foreground md:text-lg">{description}</p>
              </Rise>
            )}
          </div>
          {action && <Rise index={2}>{action}</Rise>}
        </div>
      </header>
    </>
  )
}

/**
 * The top line of a screen: back, breadcrumbs, actions on the right.
 * Plain text on the page, no container, and it scrolls away with the content.
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
        'top-bar flex h-14 items-center gap-1 -mb-4 md:-mb-6',
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
      variant="outline"
      size="icon-lg"
      aria-label="Back"
      className={className}
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
