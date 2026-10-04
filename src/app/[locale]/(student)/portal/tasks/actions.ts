'use server'

import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitAssignmentAction(
  assignmentId: string,
  content: string,
  fileData?: { fileName?: string; fileUrl?: string } | null,
  locale = 'ar'
) {
  try {
    const user = await requireStudent(locale)
    const admin = await createAdminClient()

    // Check if already submitted
    const { data: existing } = await (admin.from('assignment_submissions' as any) as any)
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single()

    if (existing) {
      return { success: false, error: 'Already submitted' }
    }

    // Check if past due date
    const { data: assignment } = await (admin.from('assignments' as any) as any)
      .select('due_date')
      .eq('id', assignmentId)
      .single()

    const isLate =
      assignment?.due_date && new Date(assignment.due_date) < new Date()

    const { error } = await (admin.from('assignment_submissions' as any) as any).insert({
      assignment_id: assignmentId,
      student_id: user.id,
      content: content ? content.trim() : null,
      file_name: fileData?.fileName || null,
      file_url: fileData?.fileUrl || null,
      status: isLate ? 'late' : 'submitted',
      submitted_at: new Date().toISOString(),
    })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/${locale}/portal/tasks`)
    return { success: true, late: isLate }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' }
  }
}
