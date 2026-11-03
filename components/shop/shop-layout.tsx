'use client'

import { IconAdjustmentsHorizontal } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Panel } from '@/components/patterns/panel'
import { PageBreadcrumbs, type Crumb } from '@/components/patterns/page-breadcrumbs'
import { PageContainer } from '@/components/patterns/page-header'
import { PanelSheet } from '@/components/patterns/panel-sheet'

/**
 * A browsing page that fits the screen, for the Shop and Explore: a bar with search (and the bag, or Explore's
 * switch and dropdowns) that always stays, and under it one scrolling area with the categories, a narrow panel
 * of dropdowns that stays in view, and the products. The page itself never scrolls.
 */
export function ShopLayout({
  title,
  breadcrumbs,
  nav,
  actions,
  panelLabel = 'Filters',
  panelMeta,
  panelAction,
  panel,
  sheetTitle = 'Filters',
  sheetOpen,
  onSheetOpenChange,
  sheetFooter,
  chosenCount = 0,
  search,
  lead,
  children,
}: {
  title: string
  /** At the start of the bar, before the search: Explore's Patterns / Makers switch */
  lead?: React.ReactNode
  /** The way back up, when you've gone into something */
  breadcrumbs?: Crumb[]
  nav?: React.ReactNode
  actions?: React.ReactNode
  /** Leave out the panel on the way into the store: there's nothing to filter yet */
  panelLabel?: string
  panelMeta?: React.ReactNode
  panelAction?: React.ReactNode
  panel?: React.ReactNode
  sheetTitle?: string
  sheetOpen?: boolean
  onSheetOpenChange?: (open: boolean) => void
  sheetFooter?: React.ReactNode
  chosenCount?: number
  /** The search field, in the top bar. Without one, the bar says the title instead. */
  search?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <PageContainer className="fit-screen">
      {/* Everything scrolls together under the floating bar, so the categories move away and only the bar and the filters stay */}
      <div className="shop-body">
        <div className="shop-bar glass-bar">
          {search ? <h1 className="sr-only">{title}</h1> : <h1 className="shop-title min-w-0 flex-1 truncate pl-2">{title}</h1>}
          {lead}
          {search && <div className="min-w-0 flex-1">{search}</div>}
          {panel && (
            <Button variant="outline" size="lg" className="lg:hidden" aria-label={chosenCount > 0 ? `Filters, ${chosenCount} chosen` : 'Filters'} onClick={() => onSheetOpenChange?.(true)}>
              <IconAdjustmentsHorizontal data-icon="inline-start" />
              {chosenCount > 0 ? <span className="tabular-nums">{chosenCount}</span> : <span className="max-sm:sr-only">Filters</span>}
            </Button>
          )}
          {actions}
        </div>
        {breadcrumbs && <PageBreadcrumbs items={breadcrumbs} className="px-1" />}
        {nav}
        {panel ? (
          <div className="grid-12">
            <div className="col-side shop-side hidden flex-col lg:flex">
              <Panel glass label={panelLabel} meta={panelMeta} action={panelAction} className="min-h-0" bodyClassName="overflow-y-auto">
                {panel}
              </Panel>
            </div>
            <div className="col-main flex min-w-0 flex-col">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>

      {panel && (
        <PanelSheet open={sheetOpen ?? false} onOpenChange={(open) => onSheetOpenChange?.(open)} title={sheetTitle} footer={sheetFooter}>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">{panel}</div>
        </PanelSheet>
      )}
    </PageContainer>
  )
}
