import { cn } from 'cn'

/**
 * Phones: the screen's main action, floating in a glass bar just above the tab bar.
 * Hidden from md, where the action sits in the page itself.
 */
export function ActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('glass fixed inset-x-3 bottom-above-tabbar z-30 mx-auto max-w-md rounded-pane p-3 md:hidden', className)}>{children}</div>
  )
}
