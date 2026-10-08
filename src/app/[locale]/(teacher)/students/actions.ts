'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const studentSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
  email: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() ? val.trim() : null)),
  classIds: z
    .array(z.string())
    .default([])
    .transform((arr) => arr.filter((id) => Boolean(id) && id.length > 10)),
  password: z.string().min(6, 'Password must be at least 6 characters').default('Student@123456'),
  mustChangePassword: z.boolean().default(false),
})

export type CreateStudentInput = z.infer<typeof studentSchema>

/**
 * Generates the next student code by querying existing codes and ensuring no Auth collision
 */
async function getNextStudentCode(): Promise<string> {
  const admin = createAdminClient()
  const { data } = await (admin.from('students' as any) as any)
    .select('student_code')
    .order('student_code', { ascending: false })
    .limit(20)

  let maxNum = 1000
  if (data && data.length > 0) {
    for (const row of data) {
      const match = String(row.student_code).match(/\d+/)
      if (match) {
        const n = parseInt(match[0], 10)
        if (!isNaN(n) && n > maxNum && n < 20000000) maxNum = n
      }
    }
  }

  // Check auth users to avoid collision with any existing auth emails like S1001@students.local
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 100 })
  const existingEmails = new Set(
    (authList?.users || []).map((u) => (u.email || '').toLowerCase())
  )

  let nextNum = maxNum + 1
  while (existingEmails.has(`s${nextNum}@students.local`)) {
    nextNum++
  }

  return `S${nextNum}`
}

/**
 * Creates a new student in Supabase Auth, Profiles, Students, and Enrollments
 */
export async function createStudentAction(input: CreateStudentInput, locale = 'en') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const parsed = studentSchema.parse(input)
    const admin = createAdminClient()

    // 1. Generate code and synthetic email
    const studentCode = await getNextStudentCode()
    const syntheticEmail = `${studentCode.toUpperCase()}@students.local`

    // 2. Create Auth User
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: parsed.password,
      email_confirm: true,
      user_metadata: {
        role: 'student',
        student_code: studentCode,
        full_name: parsed.fullName,
      },
    })

    if (authError || !authUser.user) {
      console.error('Student auth creation error:', authError)
      return { success: false, error: authError?.message || 'Failed to create student auth account' }
    }

    const studentId = authUser.user.id

    // 3. Create Profile
    const { error: profileError } = await (admin.from('profiles' as any) as any).insert({
      id: studentId,
      role: 'student',
      full_name: parsed.fullName,
      locale,
      must_change_password: parsed.mustChangePassword,
    })

    if (profileError) {
      console.error('Student profile creation error:', profileError)
      await admin.auth.admin.deleteUser(studentId)
      return { success: false, error: 'Failed to create student profile' }
    }

    // 4. Create Student record
    const { error: studentError } = await (admin.from('students' as any) as any).insert({
      id: studentId,
      student_code: studentCode,
      phone: parsed.phone || null,
      parent_phone: parsed.parentPhone || null,
      email: parsed.email || null,
      enrolled_on: new Date().toISOString().slice(0, 10),
      status: 'active',
    })

    if (studentError) {
      console.error('Student record creation error:', studentError)
      return { success: false, error: 'Failed to create student record' }
    }

    // 5. Enroll in selected classes
    if (parsed.classIds && parsed.classIds.length > 0) {
      const enrollments = parsed.classIds.map((cid) => ({
        class_id: cid,
        student_id: studentId,
        enrolled_on: new Date().toISOString().slice(0, 10),
      }))

      const { error: enrollError } = await (admin.from('enrollments' as any) as any).insert(enrollments)
      if (enrollError) {
        console.error('Enrollment error:', enrollError)
      }
    }

    revalidatePath(`/${locale}/students`)
    revalidatePath(`/${locale}/dashboard`)

    return {
      success: true,
      data: {
        id: studentId,
        studentCode,
        fullName: parsed.fullName,
        email: syntheticEmail,
        password: parsed.password,
      },
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('createStudentAction error:', err)
    return { success: false, error: msg }
  }
}

/**
 * Updates an existing student
 */
export async function updateStudentAction(
  studentId: string,
  input: {
    fullName: string
    phone?: string | null
    parentPhone?: string | null
    email?: string | null
    status?: 'active' | 'inactive' | 'archived'
    classIds?: string[]
  },
  locale = 'en'
) {
  try {
    const admin = createAdminClient()

    // 1. Update Profile
    const { error: pErr } = await (admin.from('profiles' as any) as any)
      .update({ full_name: input.fullName, updated_at: new Date().toISOString() })
      .eq('id', studentId)

    if (pErr) throw new Error(pErr.message)

    // 2. Update Student
    const isArchived = input.status === 'archived'
    const { error: sErr } = await (admin.from('students' as any) as any)
      .update({
        phone: input.phone || null,
        parent_phone: input.parentPhone || null,
        email: input.email || null,
        status: input.status || 'active',
        archived_at: isArchived ? new Date().toISOString() : null,
      })
      .eq('id', studentId)

    if (sErr) throw new Error(sErr.message)

    // 2b. Sync Auth User status: suspend/ban if inactive or archived, unban if active
    if (input.status === 'inactive' || input.status === 'archived') {
      await admin.auth.admin.updateUserById(studentId, { ban_duration: '876000h' })
    } else if (input.status === 'active') {
      await admin.auth.admin.updateUserById(studentId, { ban_duration: 'none' })
    }

    // 3. Update Enrollments if classIds passed
    if (input.classIds) {
      // Remove classes no longer enrolled
      const { data: currentEnrollments } = await (admin.from('enrollments' as any) as any)
        .select('class_id')
        .eq('student_id', studentId)
        .is('left_on', null)

      const currentClassIds = ((currentEnrollments as any[]) || []).map((e) => e.class_id)
      const toRemove = currentClassIds.filter((cid) => !input.classIds!.includes(cid))
      const toAdd = input.classIds.filter((cid) => !currentClassIds.includes(cid))

      if (toRemove.length > 0) {
        await (admin.from('enrollments' as any) as any)
          .update({ left_on: new Date().toISOString().slice(0, 10) })
          .eq('student_id', studentId)
          .in('class_id', toRemove)
      }

      if (toAdd.length > 0) {
        for (const cid of toAdd) {
          const { data: existing } = await (admin.from('enrollments' as any) as any)
            .select('id')
            .eq('student_id', studentId)
            .eq('class_id', cid)
            .maybeSingle()

          if (existing) {
            await (admin.from('enrollments' as any) as any)
              .update({ left_on: null, enrolled_on: new Date().toISOString().slice(0, 10) })
              .eq('id', existing.id)
          } else {
            await (admin.from('enrollments' as any) as any).insert({
              class_id: cid,
              student_id: studentId,
              enrolled_on: new Date().toISOString().slice(0, 10),
            })
          }
        }
      }
    }

    revalidatePath(`/${locale}/students`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}

/**
 * Quick status change action (Active / Inactive / Archived)
 * Automatically bans auth user if inactive/archived, and unbans if active.
 */
export async function updateStudentStatusAction(
  studentId: string,
  status: 'active' | 'inactive' | 'archived',
  locale = 'en'
) {
  try {
    const admin = createAdminClient()

    // 1. Update database record
    const isArchived = status === 'archived'
    const { error: sErr } = await (admin.from('students' as any) as any)
      .update({
        status,
        archived_at: isArchived ? new Date().toISOString() : null,
      })
      .eq('id', studentId)

    if (sErr) throw new Error(sErr.message)

    // 2. Sync Auth User suspension
    if (status === 'inactive' || status === 'archived') {
      await admin.auth.admin.updateUserById(studentId, { ban_duration: '876000h' })
    } else {
      await admin.auth.admin.updateUserById(studentId, { ban_duration: 'none' })
    }

    revalidatePath(`/${locale}/students`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update status'
    return { success: false, error: msg }
  }
}

/**
 * Helper to delete all records associated with a student in reverse FK order
 */
async function deleteStudentData(admin: ReturnType<typeof createAdminClient>, studentId: string) {
  // 1. Exam answers and attempts
  await (admin.from('student_answers' as any) as any)
    .delete()
    .in('attempt_id', (admin.from('exam_attempts' as any) as any).select('id').eq('student_id', studentId))
  await (admin.from('exam_results' as any) as any).delete().eq('student_id', studentId)
  await (admin.from('exam_attempts' as any) as any).delete().eq('student_id', studentId)

  // 2. Payments and allocations
  const { data: userPayments } = await (admin.from('payments' as any) as any)
    .select('id')
    .eq('student_id', studentId)
  if (userPayments && (userPayments as any[]).length > 0) {
    const payIds = (userPayments as any[]).map((p) => p.id)
    await (admin.from('payment_allocations' as any) as any).delete().in('payment_id', payIds)
    await (admin.from('payments' as any) as any).delete().eq('student_id', studentId)
  }

  // 3. Charges
  await (admin.from('charges' as any) as any).delete().eq('student_id', studentId)

  // 4. Attendance
  await (admin.from('attendance' as any) as any).delete().eq('student_id', studentId)

  // 5. Enrollments
  await (admin.from('enrollments' as any) as any).delete().eq('student_id', studentId)

  // 6. Notes
  await (admin.from('student_notes' as any) as any).delete().eq('student_id', studentId)

  // 7. Student record
  await (admin.from('students' as any) as any).delete().eq('id', studentId)

  // 8. Profile
  await (admin.from('profiles' as any) as any).delete().eq('id', studentId)

  // 9. Auth user
  await admin.auth.admin.deleteUser(studentId)
}

/**
 * Deletes a single student account and all related data
 */
export async function deleteStudentAction(studentId: string, locale = 'en') {
  try {
    const admin = createAdminClient()
    await deleteStudentData(admin, studentId)

    revalidatePath(`/${locale}/students`)
    revalidatePath(`/${locale}/dashboard`)
    return { success: true }
  } catch (err: unknown) {
    console.error('Delete student error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to delete student'
    return { success: false, error: msg }
  }
}

/**
 * Bulk deletes multiple student accounts
 */
export async function deleteMultipleStudentsAction(studentIds: string[], locale = 'en') {
  try {
    const admin = createAdminClient()
    let deletedCount = 0

    for (const sid of studentIds) {
      try {
        await deleteStudentData(admin, sid)
        deletedCount++
      } catch (e) {
        console.error(`Error deleting student ${sid}:`, e)
      }
    }

    revalidatePath(`/${locale}/students`)
    revalidatePath(`/${locale}/dashboard`)
    return { success: true, count: deletedCount }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bulk delete failed'
    return { success: false, error: msg }
  }
}

/**
 * Resets a student's password
 */
export async function resetPasswordAction(studentId: string, newPassword: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.updateUserById(studentId, {
      password: newPassword,
    })

    if (error) throw new Error(error.message)

    // Also mark must_change_password
    await (admin.from('profiles' as any) as any)
      .update({ must_change_password: true })
      .eq('id', studentId)

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reset password'
    return { success: false, error: msg }
  }
}

/**
 * Batch import students from CSV
 */
export async function importStudentsAction(
  rows: Array<{
    fullName: string
    phone?: string
    parentPhone?: string
    classId?: string
  }>,
  locale = 'en'
) {
  const results = {
    total: rows.length,
    created: 0,
    failed: 0,
    errors: [] as string[],
    students: [] as Array<{ code: string; name: string; password: string }>,
  }

  for (const r of rows) {
    if (!r.fullName || r.fullName.trim().length < 2) {
      results.failed++
      results.errors.push(`Skipped row with invalid name: "${r.fullName}"`)
      continue
    }

    const res = await createStudentAction(
      {
        fullName: r.fullName.trim(),
        phone: r.phone?.trim() || null,
        parentPhone: r.parentPhone?.trim() || null,
        classIds: r.classId ? [r.classId] : [],
        password: 'Student@123456',
        mustChangePassword: true,
      },
      locale
    )

    if (res.success && res.data) {
      results.created++
      results.students.push({
        code: res.data.studentCode,
        name: res.data.fullName,
        password: res.data.password,
      })
    } else {
      results.failed++
      results.errors.push(`Failed for "${r.fullName}": ${res.error}`)
    }
  }

  revalidatePath(`/${locale}/students`)
  return results
}
