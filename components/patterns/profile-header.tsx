import { cn } from 'cn'

import { Stipple } from './product-grid'

/**
 * A person's card, the same for you (on You) and for a maker (on their page): a big round photo, the name
 * (the page's h1), a line under it, a label pill with a word of detail, a short bio, then a few facts as rows
 * and one optional action. On phones the photo sits beside the name; from md it leads the card.
 * It sits in the side column beside the person's work (`col-side`). Facts are only real, verifiable numbers.
 */
export function ProfileHeader({
  avatar,
  name,
  label,
  labelDetail,
  subtitle,
  bio,
  stats = [],
  action,
  className,
}: {
  /** A round photo that fills its width: ProfilePhoto on You, CreatorAvatar size="profile" for a maker */
  avatar: React.ReactNode
  /** The heading; a node when it loads (your own name) */
  name: React.ReactNode
  label?: string
  /** A few words after the label, e.g. what the account type means */
  labelDetail?: string
  subtitle?: string
  bio?: string
  /** Facts shown as rows, e.g. { label: 'Patterns', value: '2' } */
  stats?: { label: string; value: string }[]
  action?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('product-grid solid-panel profile-card', className)}>
      <Stipple />
      <div className="profile-card-photo">{avatar}</div>
      <div className="relative flex min-w-0 flex-col gap-1">
        {typeof name === 'string' ? <h1 className="title-lg truncate">{name}</h1> : name}
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        {label && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Pill>{label}</Pill>
            {labelDetail && <span className="text-xs text-muted-foreground">{labelDetail}</span>}
          </div>
        )}
      </div>
      {bio && <p className="relative col-span-2 text-sm text-pretty">{bio}</p>}
      {stats.length > 0 && (
        <dl className="relative col-span-2 flex flex-col border-t pt-2">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className="text-sm font-medium tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {action && <div className="relative col-span-2 [&>*]:w-full">{action}</div>}
    </section>
  )
}

/** A small pill label, e.g. "Example profile" */
export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-6 items-center gap-1 rounded-full border border-dashed px-2.5 text-xs font-medium', className)}>{children}</span>
}
