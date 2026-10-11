const messages = [
  'Free during the beta',
  'Made in your size',
  'Sew at your own pace',
  'Every step explained',
  'Patterns by independent makers',
]

/**
 * Slim espresso bar with brand lines running slowly across. Pauses on hover;
 * stands still for people who prefer reduced motion.
 */
export function AnnouncementBar() {
  return (
    <div role="region" aria-label="Sigrid in short" className="announcement overflow-hidden bg-inverse text-inverse-foreground">
      <div className="announcement-track flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 items-center">
            {messages.map((m) => (
              <li key={m} className="eyebrow flex h-9 items-center gap-6 px-6">
                {m}
                <span aria-hidden className="size-1 rounded-full bg-inverse-foreground/60" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
