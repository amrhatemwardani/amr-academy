'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const scheduleItemSchema = z.object({
  dow: z.number().min(0).max(6), // 0 = Sunday, 1 = Monday, etc.
  start: z.string(), // "16:00"
  end: z.string(),   // "17:30"
})

const classSchema = z.object({
  name: z.string().min(2, 'Class name is required'),
  subject: z.string().min(2, 'Subject is required'),
  level: z.string().min(1, 'Level/Grade is required'),
  monthlyFee: z.number().min(0).default(500),
  schedule: z.array(scheduleItemSchema).default([]),
})

export type CreateClassInput = z.infer<typeof classSchema>

export async function createClassAction(input: CreateClassInput, locale = 'en') {
  try {
    const parsed = classSchema.parse(input)
    const admin = createAdminClient()

    // 1. Insert class
    const { data: classRow, error: cErr } = await (admin.from('classes' as any) as any)
      .insert({
        name: parsed.name,
        subject: parsed.subject,
        level: parsed.level,
        schedule: parsed.schedule,
        is_active: true,
      })
      .select('id')
      .single()

    if (cErr || !classRow) {
      throw new Error(cErr?.message || 'Failed to create class')
    }

    const classId = classRow.id

    // 2. Insert fee structure
    if (parsed.monthlyFee > 0) {
      await (admin.from('fee_structures' as any) as any).insert({
        class_id: classId,
        name: 'Monthly Fee',
        kind: 'monthly',
        amount: parsed.monthlyFee,
        active_from: new Date().toISOString().slice(0, 10),
      })
    }

    revalidatePath(`/${locale}/classes`)
    revalidatePath(`/${locale}/students`)
    revalidatePath(`/${locale}/dashboard`)

    return { success: true, classId }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating class'
    return { success: false, error: msg }
  }
}

export async function updateClassAction(
  classId: string,
  input: {
    name: string
    subject: string
    level: string
    monthlyFee?: number
    schedule?: Array<{ dow: number; start: string; end: string }>
    isActive?: boolean
  },
  locale = 'en'
) {
  try {
    const admin = createAdminClient()

    const { error: cErr } = await (admin.from('classes' as any) as any)
      .update({
        name: input.name,
        subject: input.subject,
        level: input.level,
        schedule: input.schedule || [],
        is_active: input.isActive ?? true,
      })
      .eq('id', classId)

    if (cErr) throw new Error(cErr.message)

    // Update fee structure
    if (input.monthlyFee !== undefined && input.monthlyFee >= 0) {
      const { data: existingFee } = await (admin.from('fee_structures' as any) as any)
        .select('id')
        .eq('class_id', classId)
        .eq('kind', 'monthly')
        .limit(1)

      if (existingFee && (existingFee as any[]).length > 0) {
        await (admin.from('fee_structures' as any) as any)
          .update({ amount: input.monthlyFee })
          .eq('id', (existingFee as any[])[0].id)
      } else {
        await (admin.from('fee_structures' as any) as any).insert({
          class_id: classId,
          name: 'Monthly Fee',
          kind: 'monthly',
          amount: input.monthlyFee,
          active_from: new Date().toISOString().slice(0, 10),
        })
      }
    }

    revalidatePath(`/${locale}/classes`)
    revalidatePath(`/${locale}/students`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating class'
    return { success: false, error: msg }
  }
}

export async function deleteClassAction(classId: string, locale = 'en') {
  try {
    const admin = createAdminClient()

    // Check if students enrolled
    const { count } = await (admin.from('enrollments' as any) as any)
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .is('left_on', null)

    if (count && count > 0) {
      // Soft-delete / deactivate instead of hard delete to preserve history
      await (admin.from('classes' as any) as any)
        .update({ is_active: false })
        .eq('id', classId)

      revalidatePath(`/${locale}/classes`)
      return {
        success: true,
        deactivated: true,
        message: 'Class has active enrolled students. It has been deactivated instead of deleted.',
      }
    }

    // No active enrollments: safe to hard delete fee structures & class
    await (admin.from('fee_structures' as any) as any).delete().eq('class_id', classId)
    await (admin.from('classes' as any) as any).delete().eq('id', classId)

    revalidatePath(`/${locale}/classes`)
    return { success: true, deactivated: false }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete class'
    return { success: false, error: msg }
  }
}
