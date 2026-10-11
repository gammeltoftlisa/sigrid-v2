import { cn } from 'cn'

/** "sigrid" wordmark: lowercase brand sans, with the i's dot as a pin head in the espresso accent. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span aria-label="Sigrid" className={cn('relative inline-block font-heading text-[1.6em] leading-none tracking-[-0.02em]', className)}>
      <span aria-hidden>
        s
        <span className="relative">
          ı
          <span className="absolute top-[0.12em] left-1/2 size-[0.2em] -translate-x-1/2 rounded-full bg-celebrate" />
        </span>
        grid
      </span>
    </span>
  )
}
