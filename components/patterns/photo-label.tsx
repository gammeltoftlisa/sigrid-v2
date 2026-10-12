import { cn } from 'cn'

/** A small glass pill over a photo: a condition tag, "In progress", a photo credit. Position it with absolute classes. */
export function PhotoLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('glass-chip eyebrow rounded-full px-2.5 py-1', className)}>{children}</span>
}
