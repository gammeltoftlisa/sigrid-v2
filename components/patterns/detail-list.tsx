import { cn } from 'cn'

/** Label–value pairs in a white box, e.g. company details. Placeholder values (in [brackets]) show in muted italics. */
export function DetailList({ items, className }: { items: { label: string; value: string }[]; className?: string }) {
  return (
    <dl className={cn('flex flex-col overflow-hidden rounded-(--control-radius) bg-card', className)}>
      {items.map((r) => (
        <div key={r.label} className="flex flex-col gap-0.5 p-3 sm:flex-row sm:gap-4">
          <dt className="w-44 shrink-0 text-xs text-muted-foreground sm:text-sm">{r.label}</dt>
          <dd className={r.value.startsWith('[') ? 'text-muted-foreground italic' : undefined}>{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}
