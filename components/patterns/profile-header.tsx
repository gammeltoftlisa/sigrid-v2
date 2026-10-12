import { cn } from 'cn'

/**
 * A person's header as one glass panel: large avatar, name (the page's h1) with an optional
 * label pill, a subtitle and a short bio, small stat pills, and one action on the right.
 * Stacks on phones, where the action becomes full width.
 */
export function ProfileHeader({
  avatar,
  name,
  label,
  subtitle,
  bio,
  stats = [],
  action,
  className,
}: {
  avatar: React.ReactNode
  name: string
  label?: string
  subtitle?: string
  bio?: string
  stats?: { label: string; value: string }[]
  action?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('glass-panel flex flex-col gap-4 rounded-(--radius) p-4 md:flex-row md:items-center md:gap-6 md:p-6', className)}>
      {avatar}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="!text-3xl md:!text-4xl">{name}</h1>
          {label && <Pill>{label}</Pill>}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        {bio && <p className="max-w-prose text-sm">{bio}</p>}
        {stats.length > 0 && (
          <dl className="mt-1 flex flex-wrap gap-2">
            {stats.map((s) => (
              <div key={s.label} className="flex h-8 items-baseline gap-1 rounded-full bg-card px-3 pt-1.5">
                <dd className="text-sm font-medium tabular-nums">{s.value}</dd>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
      {action && <div className="w-full md:w-auto md:min-w-40 [&>*]:w-full">{action}</div>}
    </section>
  )
}

/** A small white pill label, e.g. "Example profile" */
export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-6 items-center gap-1 rounded-full bg-card px-2.5 text-xs font-medium', className)}>{children}</span>
}
