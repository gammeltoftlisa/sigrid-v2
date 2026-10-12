import Link from 'next/link'
import { IconCheck, IconChevronRight, IconExternalLink } from '@tabler/icons-react'
import { cn } from 'cn'

/**
 * The workspace language of the sewing guide, for every screen:
 * a framed panel with a small-caps header, an optional taupe count and a hairline
 * progress line, then rows; an optional action footer like the guide's "Mark done" bar.
 */
export function Panel({
  label,
  meta,
  progress,
  action,
  footer,
  children,
  className,
  bodyClassName,
}: {
  /** Small-caps panel label, e.g. "Your project" */
  label: string
  /** Right side of the header, e.g. "5 / 17" */
  meta?: React.ReactNode
  /** 0–100: draws the hairline progress line under the header */
  progress?: number
  /** Small action in the header (button or link) */
  action?: React.ReactNode
  /** Action bar at the bottom of the panel */
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('glass-panel flex flex-col overflow-hidden rounded-(--radius) border', className)}>
      <header className="flex flex-col gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="eyebrow !font-medium text-muted-foreground">{label}</h2>
          <div className="flex items-center gap-3">
            {meta !== undefined && <span className="text-xs font-medium text-brand-ink tabular-nums">{meta}</span>}
            {action}
          </div>
        </div>
        {progress !== undefined && (
          <div className="h-0.5 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} progress`}>
            <div className="panel-progress h-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        )}
      </header>
      <div className={cn('flex min-h-0 flex-col gap-2 px-3 pb-3', bodyClassName)}>{children}</div>
      {footer && <footer className="mt-auto border-t px-3 py-3">{footer}</footer>}
    </section>
  )
}

export type RowState = 'done' | 'active' | 'upcoming'

/** Round status marker from the guide: done = soft with a check, active = solid, upcoming = outlined. */
export function StepDot({ state, children, className }: { state: RowState; children?: React.ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full text-2xs font-medium tabular-nums transition-colors duration-200',
        state === 'done' && 'bg-accent text-primary',
        state === 'active' && 'bg-primary text-primary-foreground',
        state === 'upcoming' && 'border bg-muted text-muted-foreground',
        className,
      )}
    >
      {state === 'done' ? <IconCheck className="size-3.5" stroke={2.5} /> : children}
    </span>
  )
}

/**
 * A bordered row inside a Panel: leading marker or icon tile, title (+ detail),
 * right-hand meta. The active row is framed in ink, like the current step in the guide.
 */
export function PanelRow({
  leading,
  title,
  detail,
  meta,
  state = 'upcoming',
  trailing,
  href,
  external,
  className,
}: {
  leading?: React.ReactNode
  title: React.ReactNode
  detail?: React.ReactNode
  meta?: React.ReactNode
  state?: RowState
  trailing?: React.ReactNode
  /** Makes the whole row a link, with a chevron at the end */
  href?: string
  /** The link leaves Sigrid: opens in a new tab, with an outward arrow instead of the chevron */
  external?: boolean
  className?: string
}) {
  const Row = href ? (external ? 'a' : Link) : 'div'
  return (
    <Row
      href={href as string}
      {...(external && { target: '_blank', rel: 'noopener' })}
      data-state={state}
      className={cn(
        'flex items-center gap-3 rounded-(--control-radius) border px-2.5 py-2.5 transition-colors',
        href && 'group/row outline-none hover:bg-background',
        state === 'active' ? 'border-foreground/35 bg-background' : 'bg-card',
        state === 'done' && 'border-transparent',
        className,
      )}
    >
      {leading}
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            'truncate text-sm',
            state === 'active' && 'font-medium text-foreground',
            state === 'done' && 'text-muted-foreground',
          )}
        >
          {title}
        </span>
        {detail && <span className="line-clamp-2 text-xs text-muted-foreground">{detail}</span>}
      </div>
      {meta !== undefined && (
        <span className={cn('text-xs font-medium tabular-nums', state === 'active' ? 'text-brand-ink' : 'text-muted-foreground')}>{meta}</span>
      )}
      {trailing}
      {href && external && <IconExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      {href && !external && (
        <IconChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/row:translate-x-0.5" aria-hidden />
      )}
    </Row>
  )
}
