'use server'

import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Create Assignment ──────────────────────────────────────────────────────

export async function createAssignmentAction(
  data: {
    title: string
    description?: string
    type: string
    classId?: string
    studentId?: string
    dueDate?: string
    maxScore: number
    resource_link?: string | null
  },
  locale: string
) {
  try {
    await requireTeacher(locale)
    const admin = createAdminClient()

    const { error } = await (admin.from('assignments' as any) as any).insert({
      title: data.title,
      description: data.description || null,
      type: data.type,
      class_id: data.classId || null,
      student_id: data.studentId || null,
      due_date: data.dueDate || null,
      max_score: data.maxScore,
      resource_link: data.resource_link || null,
      is_active: true,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/${locale}/assignments`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' }
  }
}

// ── Delete Assignment ──────────────────────────────────────────────────────

export async function deleteAssignmentAction(id: string, locale: string) {
  try {
    await requireTeacher(locale)
    const admin = createAdminClient()

    const { error } = await (admin.from('assignments' as any) as any)
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/${locale}/assignments`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' }
  }
}

// ── Grade Submission ───────────────────────────────────────────────────────

export async function gradeSubmissionAction(
  submissionId: string,
  score: number,
  teacherNote: string,
  locale: string
) {
  try {
    await requireTeacher(locale)
    const admin = createAdminClient()

    const { error } = await (admin.from('assignment_submissions' as any) as any)
      .update({
        score,
        teacher_note: teacherNote,
        status: 'graded',
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/${locale}/assignments`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' }
  }
}

// ?? Get Questions for Picker ??????????????????????????????????????????????

export async function getQuestionsForPickerAction() {
  try {
    const admin = createAdminClient() // SYNC, no await
    const { data: questions, error } = await (admin.from('questions' as any) as any)
      .select('id, type, body, default_marks, subject')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return { questions: [] }
    return { questions: questions || [] }
  } catch { return { questions: [] } }
}
