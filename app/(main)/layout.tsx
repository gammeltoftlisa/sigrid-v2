import { AppShell } from '@/components/patterns/app-nav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main>{children}</main>
    </AppShell>
  )
}
