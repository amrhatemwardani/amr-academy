import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { Toaster } from 'sonner'

export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // This will redirect to /login if not authenticated as teacher
  const user = await requireTeacher(locale)

  const admin = await createAdminClient()
  const { count: unreadCount } = await (admin.from('notifications' as any) as any)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar className="hidden lg:flex shrink-0" />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar
          userName={user.fullName}
          role="teacher"
          unreadNotifications={unreadCount || 0}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="container mx-auto max-w-7xl p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'border border-border bg-background text-foreground shadow-lg',
            error: 'border-destructive/30 bg-destructive/10 text-destructive',
            success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
          },
        }}
      />
    </div>
  )
}
