import { cn } from "cn"

/**
 * Standard vertical section on a screen. Editorial header: a taupe section number
 * (automatic, counted per page), the title, and a hairline running out to the right,
 * then an optional action. Description and content below.
 */
function PageSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <h2 className="page-section-title text-[1.375rem] leading-tight font-medium tracking-tight">{title}</h2>
          <span aria-hidden className="page-section-rule" />
          {action}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export { PageSection }
