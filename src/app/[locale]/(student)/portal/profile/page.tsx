import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { ProfileClientView } from './ProfileClientView'

export const metadata: Metadata = { title: 'Profile' }

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)

  const admin = await createAdminClient()

  // Fetch full student & profile record
  const { data: profile } = await (admin.from('profiles' as any) as any)
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  const { data: student } = await (admin.from('students' as any) as any)
    .select('student_code, parent_phone, status')
    .eq('id', user.id)
    .single()

  return (
    <ProfileClientView
      locale={locale}
      student={{
        fullName: profile?.full_name || user.fullName,
        studentCode: student?.student_code || 'S1000',
        phone: profile?.phone || null,
        parentPhone: student?.parent_phone || null,
        grade: student?.grade || null,
        school: student?.school || null,
        status: student?.status || 'active',
      }}
    />
  )
}
