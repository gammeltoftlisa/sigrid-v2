import { AppShell } from '@/components/patterns/app-nav'
import { LegalFooter } from '@/components/patterns/legal-footer'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main>{children}</main>
      <LegalFooter />
    </AppShell>
  )
}
