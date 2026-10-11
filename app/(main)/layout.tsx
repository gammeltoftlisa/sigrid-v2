import { AnnouncementBar } from '@/components/patterns/announcement-bar'
import { AppSidebar, AppTabBar } from '@/components/patterns/app-nav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <AnnouncementBar />
        <main className="pb-20 md:pb-0">{children}</main>
      </div>
      <AppTabBar />
    </div>
  )
}
