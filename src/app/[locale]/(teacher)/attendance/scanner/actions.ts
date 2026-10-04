'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function punchAttendanceAction({
  classId,
  studentIdentifier,
  date,
  status = 'present',
}: {
  classId: string
  studentIdentifier: string
  date: string
  status?: 'present' | 'late' | 'excused'
}) {
  const code = studentIdentifier?.trim().toUpperCase()
  if (!code) return { error: 'Please enter a student code or scan QR.' }

  const admin = await createAdminClient()

  // 1. Try finding student by code (e.g. S1001 or 1001) or UUID
  let query = (admin.from('students' as any) as any)
    .select('id, student_code, profiles(full_name)')

  if (code.startsWith('S')) {
    query = query.eq('student_code', code)
  } else if (/^\d+$/.test(code)) {
    query = query.eq('student_code', 'S' + code)
  } else {
    // Try UUID or exact code match
    query = query.or(`id.eq.${code},student_code.eq.${code}`)
  }

  const { data: students, error: sErr } = await query.limit(1)

  if (sErr || !students || students.length === 0) {
    return { error: `Student with code "${code}" not found.` }
  }

  const student = students[0]
  const studentId = student.id
  const studentName = student.profiles?.full_name || student.student_code

  // 2. Check if student is enrolled in this class
  const { data: enrollment } = await (admin.from('enrollments' as any) as any)
    .select('id')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .is('left_on', null)
    .single()

  const isEnrolled = !!enrollment

  // 3. Upsert attendance record
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: upserted, error: attErr } = await (admin.from('attendance' as any) as any)
    .upsert(
      {
        class_id: classId,
        student_id: studentId,
        date: date,
        status: status,
        marked_by: user?.id || null,
        note: isEnrolled ? null : 'Attendance recorded (not formally enrolled in class)',
      },
      { onConflict: 'class_id,student_id,date' }
    )
    .select('id, status, updated_at')
    .single()

  if (attErr) {
    return { error: attErr.message }
  }

  revalidatePath('/en/attendance')
  revalidatePath('/ar/attendance')

  return {
    success: true,
    student: {
      id: studentId,
      code: student.student_code,
      name: studentName,
      status: status,
      isEnrolled,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
  }
}
