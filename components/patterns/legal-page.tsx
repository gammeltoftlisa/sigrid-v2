import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { business } from '@/lib/legal'

export const legalPages = [
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/refunds', label: 'Refunds' },
  { href: '/legal/company', label: 'Company details' },
]

/** A legal text page: title, last updated, sections with headings. The footer links to the other legal pages. */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <PageContainer>
      <PageHeader breadcrumbs={[{ label: 'Home', href: '/home' }, { label: title }]} title={title} description={intro} />
      <article className="legal-prose flex max-w-prose flex-col gap-8">
        {children}
        <p className="text-xs text-muted-foreground">Last updated {business.updated}.</p>
      </article>
    </PageContainer>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground [&_li]:ml-5 [&_li]:list-disc [&_a]:underline [&_a]:underline-offset-4">{children}</div>
    </section>
  )
}
