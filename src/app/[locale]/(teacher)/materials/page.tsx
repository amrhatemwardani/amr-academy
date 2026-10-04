import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { MaterialsClientView } from './MaterialsClientView'

export default async function MaterialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  await requireTeacher(locale)
  const admin = createAdminClient()

  const [{ data: materials }, { data: classes }] = await Promise.all([
    (admin.from('materials' as any) as any)
      .select('id, title, section, chapter, drive_url, class_id, description, is_active, sort_order, created_at, classes(name)')
      .order('section').order('sort_order').order('created_at'),
    (admin.from('classes' as any) as any).select('id, name').eq('is_active', true).order('name'),
  ])

  return <MaterialsClientView materials={materials || []} classes={classes || []} locale={locale} />
}
