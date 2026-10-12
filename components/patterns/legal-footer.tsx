import Link from 'next/link'

import { legalPages } from '@/components/patterns/legal-page'
import { business } from '@/lib/legal'

/** Quiet footer on every app screen: legal links and who runs Sigrid. */
export function LegalFooter() {
  return (
    <footer className="flex flex-col gap-2 px-4 pt-4 pb-6 text-xs text-muted-foreground sm:px-6 md:pr-8 md:pl-4">
      <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
        {legalPages.map((p) => (
          <Link key={p.href} href={p.href} className="underline-offset-4 hover:text-foreground hover:underline">
            {p.label}
          </Link>
        ))}
      </nav>
      <p>© {new Date().getFullYear()} {business.name}</p>
    </footer>
  )
}
