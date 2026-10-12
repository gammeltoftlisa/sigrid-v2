import { cn } from 'cn'

/** "sigrid" wordmark: lowercase brand sans, with the i's dot as a pin head. Sized by the parent font size. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Sigrid" className={cn('wordmark', className)}>
      <span aria-hidden>
        s
        <span className="relative">
          ı
          <span className="wordmark-dot" />
        </span>
        grid
      </span>
    </span>
  )
}

/** The rail's mark: a single "s" with the pin-head dot. */
export function Logomark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('wordmark text-base', className)}>
      s
      <span className="logomark-dot" />
    </span>
  )
}
