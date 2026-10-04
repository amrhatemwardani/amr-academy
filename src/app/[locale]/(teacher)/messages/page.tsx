import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeacherConversations, getStudentMessages, ChatMessage } from '@/lib/messages/actions'
import { TeacherMessagesClientView } from './TeacherMessagesClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Messages' }

export default async function TeacherMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireTeacher(locale)

  const admin = await createAdminClient()

  // 1. Fetch conversations summary
  const conversations = await getTeacherConversations()

  // 2. Fetch all active students list (so teacher can initiate a message to any student)
  const { data: rawStudents } = await (admin.from('students' as any) as any)
    .select('id, student_code, profiles(full_name)')
    .order('student_code', { ascending: true })

  const allStudents = ((rawStudents as any[]) || []).map((s: any) => ({
    id: s.id,
    code: s.student_code || 'S0000',
    name: s.profiles?.full_name || 'Student',
  }))

  // 3. Preload messages for the initial active conversations
  const initialMessagesMap: Record<string, ChatMessage[]> = {}
  const targetStudents = conversations.slice(0, 5).map((c) => c.studentId)
  if (targetStudents.length === 0 && allStudents[0]) {
    targetStudents.push(allStudents[0].id)
  }

  await Promise.all(
    targetStudents.map(async (sId) => {
      initialMessagesMap[sId] = await getStudentMessages(sId)
    })
  )

  return (
    <TeacherMessagesClientView
      locale={locale}
      teacherId={user.id}
      teacherName={user.fullName}
      conversations={conversations}
      allStudents={allStudents}
      initialMessagesMap={initialMessagesMap}
    />
  )
}
