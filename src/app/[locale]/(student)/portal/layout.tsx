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
    <div className="flex flex-col min-h-screen bg-[#fffdf5] dark:bg-[#0a0e17] text-gray-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top bar with warm branding */}
      <TopBar
        userName={user.fullName}
        role="student"
        unreadNotifications={unreadCount || 0}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="container mx-auto max-w-3xl px-4 py-5">
          {children}
        </div>
      </main>

      {/* Bottom tab navigation (mobile-first) */}
      <MobileNav />

      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: 'border border-amber-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-gray-900 dark:text-slate-100 shadow-xl rounded-2xl',
            error: 'border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300',
            success: 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
          },
        }}
      />
    </div>
  )
}
