'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addStudentNoteAction(studentId: string, noteText: string) {
  const content = noteText?.trim()
  if (!content) return { error: 'Note cannot be empty.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = await createAdminClient()

  const { data, error } = await (admin.from('student_notes' as any) as any)
    .insert({
      student_id: studentId,
      note: content,
      created_by: user.id,
    })
    .select('id, created_at')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/en/students/${studentId}`)
  revalidatePath(`/ar/students/${studentId}`)

  return { success: true, note: data }
}

export async function deleteStudentNoteAction(noteId: string, studentId: string) {
  const admin = await createAdminClient()

  const { error } = await (admin.from('student_notes' as any) as any)
    .delete()
    .eq('id', noteId)

  if (error) return { error: error.message }

  revalidatePath(`/en/students/${studentId}`)
  revalidatePath(`/ar/students/${studentId}`)

  return { success: true }
}
