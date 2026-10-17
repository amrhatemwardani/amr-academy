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
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: '#fffdf5' }}
    >
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
            toast: 'border border-amber-200 bg-white text-gray-900 shadow-xl rounded-2xl',
            error: 'border-red-300 bg-red-50 text-red-700',
            success: 'border-emerald-300 bg-emerald-50 text-emerald-800',
          },
        }}
      />
    </div>
  )
}
