import { cn } from 'cn'

/** The page's tiny dots, drawn from the pattern that Atmosphere defines for the whole document */
export function Stipple() {
  return (
    <svg aria-hidden className="stipple">
      <rect width="100%" height="100%" fill="url(#stipple-dots)" />
    </svg>
  )
}

/**
 * The one container for products: a solid fill a little lighter than the page, with the page's dots and a
 * stroke between products instead of a box around each. A page shares one of these for all its
 * products. Put a `tiles` grid of GarmentCard, FabricCard or MakerCard inside, or use ProjectGrid for projects.
 * Products never sit directly on the background, and never go in a glass Panel.
 */
export function ProductGrid({
  label,
  meta,
  children,
  className,
  ...props
}: {
  /** Small-caps label, e.g. "In progress" */
  label?: string
  /** Right side of the label row, e.g. a count */
  meta?: React.ReactNode
  children: React.ReactNode
  className?: string
} & React.ComponentProps<'section'>) {
  return (
    <section className={cn('product-grid', className)} {...props}>
      <Stipple />
      {label && (
        <header className="product-grid-header flex items-center justify-between gap-3 px-4 py-3">
          <h2 className="eyebrow text-muted-foreground">{label}</h2>
          {meta !== undefined && <span className="text-xs font-medium text-brand-ink tabular-nums">{meta}</span>}
        </header>
      )}
      {children}
    </section>
  )
}

/** The same filled container around one large product photo, as on a garment page */
export function ProductFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('product-grid p-3', className)}>
      <Stipple />
      {children}
    </div>
  )
}
