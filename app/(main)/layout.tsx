import { AppSidebar, AppTabBar } from '@/components/patterns/app-nav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      <AppTabBar />
    </div>
  )
}
