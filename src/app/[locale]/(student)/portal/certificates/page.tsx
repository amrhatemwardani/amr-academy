import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StudentCertificatesClientView } from './StudentCertificatesClientView'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'شهادات التقدير والتكريم | أكاديمية م. عمرو حاتم' : 'Certificates & Honors | Eng. Amr Hatem Academy',
  }
}

interface ExamResult {
  id: string
  percentage: number
  score: number
  total: number
  exams?: {
    title: string
  } | null
}

export default async function StudentCertificatesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)
  const supabase = await createClient()

  // 1. Fetch student info
  const { data: student } = await (supabase.from('students' as any) as any)
    .select('id, student_code, enrolled_on, status')
    .eq('id', user.id)
    .single()

  // 2. Fetch exam results with high scores (>= 85%)
  const { data: rawResults } = await (supabase.from('exam_results' as any) as any)
    .select(`
      id, score, total, percentage,
      exams ( title )
    `)
    .eq('student_id', user.id)
    .not('published_at', 'is', null)
    .order('percentage', { ascending: false })

  const topExams = ((rawResults as any[]) || []).map((r) => ({
    title: r.exams?.title || 'الاختبار الشامل',
    percentage: Math.round(parseFloat(r.percentage) || 100),
    score: r.score,
    total: r.total,
  }))

  // 3. Fetch attendance count
  const { count: attendanceCount } = await (supabase.from('attendance' as any) as any)
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('status', 'present')

  return (
    <StudentCertificatesClientView
      locale={locale}
      student={{
        id: user.id,
        fullName: user.fullName,
        studentCode: student?.student_code || 'S1001',
        enrolledOn: student?.enrolled_on || new Date().toISOString().slice(0, 10),
      }}
      topExams={topExams}
      attendanceCount={attendanceCount || 0}
    />
  )
}
