import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStudentMessages } from '@/lib/messages/actions'
import { StudentChatClientView } from './StudentChatClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Teacher Chat' }

export default async function StudentMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)

  const admin = await createAdminClient()

  // Find teacher name
  const { data: teacher } = await (admin.from('profiles' as any) as any)
    .select('full_name')
    .eq('role', 'teacher')
    .limit(1)
    .single()

  const teacherName = teacher?.full_name || 'Teacher Amr'

  // Fetch messages history
  const messages = await getStudentMessages(user.id)

  return (
    <StudentChatClientView
      locale={locale}
      studentId={user.id}
      studentName={user.fullName}
      teacherName={teacherName}
      initialMessages={messages}
    />
  )
}
