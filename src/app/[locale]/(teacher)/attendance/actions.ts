'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface AttendanceRowInput {
  student_id: string
  status: 'present' | 'absent' | 'late' | 'excused'
  note?: string | null
}

export async function saveAttendanceAction(
  classId: string,
  date: string,
  rows: AttendanceRowInput[],
  locale = 'en'
) {
  try {
    const supabase = await createClient()

    // Call atomic RPC function save_attendance
    const { error } = await (supabase.rpc as any)('save_attendance', {
      p_class_id: classId,
      p_date: date,
      p_rows: rows,
    })

    if (error) {
      console.error('save_attendance RPC error:', error)
      throw new Error(error.message)
    }

    revalidatePath(`/${locale}/attendance`)
    revalidatePath(`/${locale}/dashboard`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save attendance'
    return { success: false, error: msg }
  }
}
