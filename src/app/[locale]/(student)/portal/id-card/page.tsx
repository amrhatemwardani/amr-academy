import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { IDCardClientView } from './IDCardClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Digital ID Card' }

export default async function StudentIDCardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)

  const admin = await createAdminClient()

  // 1. Fetch student info
  const { data: student } = await (admin.from('students' as any) as any)
    .select('student_code, phone, parent_phone, enrolled_on, status')
    .eq('id', user.id)
    .single()

  // 2. Fetch Academy name from settings
  const { data: schoolSetting } = await (admin.from('settings' as any) as any)
    .select('value')
    .eq('key', 'school_name')
    .single()

  let academyName = 'Amr Academy'
  if (schoolSetting?.value) {
    academyName = typeof schoolSetting.value === 'string'
      ? schoolSetting.value.replace(/^"|"$/g, '')
      : schoolSetting.value
  }

  return (
    <IDCardClientView
      locale={locale}
      student={{
        id: user.id,
        code: student?.student_code || 'S1001',
        fullName: user.fullName,
        grade: student?.grade || null,
        school: student?.school || null,
        phone: student?.phone || null,
        parentPhone: student?.parent_phone || null,
        enrolledOn: student?.enrolled_on || new Date().toISOString().split('T')[0],
        status: student?.status || 'active',
      }}
      academyName={academyName}
    />
  )
}
