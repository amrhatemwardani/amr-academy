import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { Toaster } from 'sonner'

export default async function StudentPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Redirects to /login if not authenticated as student
  const user = await requireStudent(locale)

  const admin = createAdminClient()
  const { count: unreadCount } = await (admin.from('notifications' as any) as any)
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .is('read_at', null)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <TopBar
        userName={user.fullName}
        role="student"
        unreadNotifications={unreadCount || 0}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {/* pb-20 accounts for the fixed bottom nav */}
        <div className="container mx-auto max-w-2xl px-4 py-4">
          {children}
        </div>
      </main>

      {/* Bottom tab navigation (mobile-first) */}
      <MobileNav />

      <Toaster
        position="top-center"
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

