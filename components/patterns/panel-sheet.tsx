import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

/**
 * A side panel that slides in from the right: full width on phones, 448px on larger screens.
 * Title (and optional description) at the top, scrolling content, optional footer actions.
 * Used for the fabric bag and the phone filters.
 */
export function PanelSheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="panel-sheet gap-0 p-0">
        <SheetHeader className="p-4 pr-12">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        {footer && <SheetFooter className="flex-row gap-2 p-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}
