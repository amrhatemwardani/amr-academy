'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ApplicationItem {
  id: string
  code: string
  studentName: string
  grade: string
  subject: string
  mode: string
  studentPhone: string
  parentPhone: string
  country?: string
  countryCode?: string
  parentCountryCode?: string
  studyLanguage?: string
  governorate?: string
  notes?: string
  status: 'pending' | 'contacted' | 'enrolled' | 'rejected'
  createdAt: string
  readAt?: string | null
}

export interface SubmitApplicationInput {
  studentName: string
  grade: string
  subject: string
  mode: string
  studentPhone: string
  parentPhone: string
  country?: string
  countryCode?: string
  parentCountryCode?: string
  studyLanguage?: string
  governorate?: string
  notes?: string
}

// ── Submit New Application (Called from /apply page) ─────────────────────
export async function submitApplicationAction(data: SubmitApplicationInput) {
  try {
    const admin = createAdminClient()

    // Find teacher profile to assign notification
    const { data: teacher } = await (admin.from('profiles' as any) as any)
      .select('id')
      .eq('role', 'teacher')
      .limit(1)
      .single()

    const randomCode = 'AMR-' + Math.floor(100000 + Math.random() * 900000)

    const teacherId = teacher?.id

    if (teacherId) {
      await (admin.from('notifications' as any) as any).insert({
        user_id: teacherId,
        type: 'admission_application',
        title: data.studentName.trim(),
        body: `طلب انضمام جديد (${data.grade}) — هاتف: ${data.studentPhone}`,
        channel: 'in_app',
        metadata: {
          code: randomCode,
          studentName: data.studentName.trim(),
          grade: data.grade,
          subject: data.subject,
          mode: data.mode,
          studentPhone: data.studentPhone.trim(),
          parentPhone: data.parentPhone.trim(),
          country: data.country || 'Egypt',
          countryCode: data.countryCode || '+20',
          parentCountryCode: data.parentCountryCode || '+20',
          studyLanguage: data.studyLanguage || 'arabic',
          governorate: data.governorate?.trim() || '',
          notes: data.notes?.trim() || '',
          status: 'pending',
        },
      })
    }

    revalidatePath('/en/applications')
    revalidatePath('/ar/applications')
    revalidatePath('/en/dashboard')
    revalidatePath('/ar/dashboard')

    return { success: true, code: randomCode }
  } catch (err) {
    console.error('Error submitting application:', err)
    return { error: 'Failed to submit application. Please try again.' }
  }
}

// ── Get All Applications for Teacher ──────────────────────────────────
export async function getApplicationsAction(): Promise<ApplicationItem[]> {
  try {
    const admin = createAdminClient()

    const { data, error } = await (admin.from('notifications' as any) as any)
      .select('id, user_id, title, body, metadata, created_at, read_at')
      .eq('type', 'admission_application')
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map((item: any) => {
      const meta = item.metadata || {}
      return {
        id: item.id,
        code: meta.code || 'AMR-000000',
        studentName: meta.studentName || item.title || 'طالب جديد',
        grade: meta.grade || 'grade_12',
        subject: meta.subject || 'physics',
        mode: meta.mode || 'center',
        studentPhone: meta.studentPhone || '',
        parentPhone: meta.parentPhone || '',
        country: meta.country || 'Egypt',
        countryCode: meta.countryCode || '+20',
        parentCountryCode: meta.parentCountryCode || '+20',
        studyLanguage: meta.studyLanguage || 'arabic',
        governorate: meta.governorate || '',
        notes: meta.notes || '',
        status: meta.status || 'pending',
        createdAt: item.created_at,
        readAt: item.read_at,
      }
    })
  } catch (err) {
    console.error('Error fetching applications:', err)
    return []
  }
}

// ── Update Application Status ─────────────────────────────────────────
export async function updateApplicationStatusAction(
  id: string,
  newStatus: 'pending' | 'contacted' | 'enrolled' | 'rejected'
) {
  try {
    const admin = createAdminClient()

    // Fetch current row
    const { data: current } = await (admin.from('notifications' as any) as any)
      .select('metadata')
      .eq('id', id)
      .single()

    if (!current) return { error: 'Application not found' }

    const updatedMetadata = {
      ...(current.metadata || {}),
      status: newStatus,
    }

    const { error } = await (admin.from('notifications' as any) as any)
      .update({
        metadata: updatedMetadata,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/en/applications')
    revalidatePath('/ar/applications')
    revalidatePath('/en/dashboard')
    revalidatePath('/ar/dashboard')

    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}

// ── Delete Application ───────────────────────────────────────────────
export async function deleteApplicationAction(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await (admin.from('notifications' as any) as any)
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/en/applications')
    revalidatePath('/ar/applications')

    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}
