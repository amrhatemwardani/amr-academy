import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { CertificatesClientView } from './CertificatesClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Certificates Generator',
}

export default async function CertificatesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const admin = createAdminClient()

  // Fetch active students with profiles
  const { data: rawStudents } = await (admin.from('students' as any) as any)
    .select(`
      id, student_code, status,
      profiles ( full_name )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Fetch top exam scores per student
  const { data: rawResults } = await (admin.from('exam_results' as any) as any)
    .select('student_id, percentage')
    .not('published_at', 'is', null)
    .order('percentage', { ascending: false })

  const scoreMap: Record<string, number> = {}
  ;((rawResults as any[]) || []).forEach((r) => {
    if (!scoreMap[r.student_id]) {
      scoreMap[r.student_id] = Math.round(parseFloat(r.percentage) || 100)
    }
  })

  const students = ((rawStudents as any[]) || []).map((s: any) => ({
    id: s.id,
    name: s.profiles?.full_name || 'طالب متميز',
    code: s.student_code || 'AMR-000',
    score: scoreMap[s.id] || 100,
  }))

  return (
    <CertificatesClientView
      locale={locale}
      students={students}
    />
  )
}
