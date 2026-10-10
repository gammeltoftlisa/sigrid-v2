import { Fragment } from 'react'
import Link from 'next/link'
import { cn } from 'cn'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export interface Crumb {
  label: string
  /** Omit for the current page (always the last crumb) */
  href?: string
}

/**
 * Where you are in the app, on every screen: small caps, quiet, the current page in ink.
 * The first crumb is always Home; the last is the page itself.
 */
export function PageBreadcrumbs({
  items,
  label = 'Breadcrumb',
  className,
}: {
  items: Crumb[]
  /** Accessible name; only change it if a page shows more than one trail */
  label?: string
  className?: string
}) {
  return (
    <Breadcrumb aria-label={label} className={cn('min-w-0', className)}>
      <BreadcrumbList className="flex-nowrap">
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className={cn(last && 'min-w-0')}>
                {last || !c.href ? (
                  <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
