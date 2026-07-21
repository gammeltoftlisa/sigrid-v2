import TabBar from '@/components/ui/TabBar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <TabBar />
    </div>
  )
}
