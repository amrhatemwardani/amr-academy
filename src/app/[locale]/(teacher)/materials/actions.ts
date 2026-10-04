'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createMaterialAction(data: {
  title: string; section: string; chapter?: string;
  drive_url: string; class_id?: string | null;
  description?: string; sort_order?: number
}, locale = 'en') {
  try {
    const admin = createAdminClient()
    const { error } = await (admin.from('materials' as any) as any).insert({
      title: data.title.trim(),
      section: data.section.trim(),
      chapter: data.chapter?.trim() || null,
      drive_url: data.drive_url.trim(),
      class_id: data.class_id || null,
      description: data.description?.trim() || null,
      sort_order: data.sort_order ?? 0,
      is_active: true,
    })
    if (error) throw new Error(error.message)
    revalidatePath(`/${locale}/materials`)
    revalidatePath(`/${locale}/portal/resources`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' }
  }
}

export async function updateMaterialAction(id: string, data: {
  title: string; section: string; chapter?: string;
  drive_url: string; class_id?: string | null;
  description?: string; sort_order?: number; is_active?: boolean
}, locale = 'en') {
  try {
    const admin = createAdminClient()
    const { error } = await (admin.from('materials' as any) as any)
      .update({
        title: data.title.trim(),
        section: data.section.trim(),
        chapter: data.chapter?.trim() || null,
        drive_url: data.drive_url.trim(),
        class_id: data.class_id || null,
        description: data.description?.trim() || null,
        sort_order: data.sort_order ?? 0,
        is_active: data.is_active ?? true,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(`/${locale}/materials`)
    revalidatePath(`/${locale}/portal/resources`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' }
  }
}

export async function deleteMaterialAction(id: string, locale = 'en') {
  try {
    const admin = createAdminClient()
    const { error } = await (admin.from('materials' as any) as any).delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(`/${locale}/materials`)
    revalidatePath(`/${locale}/portal/resources`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' }
  }
}
