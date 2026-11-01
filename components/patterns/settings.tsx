import Link from 'next/link'
import { IconChevronRight } from '@tabler/icons-react'
import { cn } from 'cn'

/**
 * One container for a whole settings page, with a stroke between groups instead of a box around each.
 * It holds controls, so it's glass. Put an optional header, then SettingsGroups, inside.
 */
export function SettingsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('glass-panel settings-list rounded-(--radius) border', className)}>{children}</div>
}

/** A labelled group of settings: the label on the left from `md`, its rows beside it. */
export function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="settings-group">
      <h2 className="eyebrow text-muted-foreground">{label}</h2>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </section>
  )
}

/** One setting: what it is on the left, its control on the right. Wraps under the text on phones. */
export function SettingsRow({
  title,
  description,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** The control, usually one button, select or switch */
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

/** Pages to go to from a group, as plain rows with a chevron. Tall enough to tap on a phone. */
export function SettingsLinks({ label, links }: { label: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={label} className="-my-3 flex flex-col">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="group/row flex min-h-11 items-center justify-between gap-4 text-sm font-medium outline-none">
          {l.label}
          <IconChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/row:translate-x-0.5" aria-hidden />
        </Link>
      ))}
    </nav>
  )
}
