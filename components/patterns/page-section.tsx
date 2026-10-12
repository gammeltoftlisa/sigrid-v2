import { cn } from "cn"

/**
 * Standard vertical section on a screen: the title,
 * then an optional action. Description and content below.
 */
function PageSection({
  title,
  description,
  action,
  children,
  className,
}: {
  /** Leave out when the page has only one section, so the heading doesn't repeat the page title */
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {title && <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <h2 className="page-section-title text-xl font-semibold">{title}</h2>
          {action}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>}
      {children}
    </section>
  )
}

export { PageSection }
