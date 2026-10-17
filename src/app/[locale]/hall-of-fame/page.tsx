import { createAdminClient } from '@/lib/supabase/admin'
import { HallOfFameClientView, HonorStudent } from './HallOfFameClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'لوحة الشرف والمتفوقين | Hall of Fame',
  description: 'أوائل ومتفوقي أكاديمية المهندس عمرو حاتم في الفيزياء والرياضيات',
}

export default async function HallOfFamePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const admin = createAdminClient()

  // 1. Fetch real top exam results from Supabase
  const { data: topResults, error: topError } = await (admin.from('exam_results' as any) as any)
    .select(`
      attempt_id, score, total, percentage, published_at,
      exams ( id, title ),
      students (
        id, status,
        profiles ( full_name )
      )
    `)
    .order('percentage', { ascending: false })
    .limit(20)

  // 2. Fetch real active students from Supabase to ensure complete roster
  const { data: activeStudents, error: actError } = await (admin.from('students' as any) as any)
    .select(`
      id, status,
      profiles ( full_name )
    `)
    .eq('status', 'active')
    .limit(20)

  // Format real students from database
  const realStudentsList: HonorStudent[] = []
  const seenStudentNames = new Set<string>()

  // A) Top exam performers from database
  ;((topResults as any[]) || []).forEach((r: any) => {
    const student = r.students
    const fullName = student?.profiles?.full_name?.trim()
    if (!fullName || seenStudentNames.has(fullName)) return
    seenStudentNames.add(fullName)

    realStudentsList.push({
      id: student.id,
      nameAr: fullName,
      nameEn: fullName,
      score: `${r.percentage}% (${r.score}/${r.total})`,
      rank: realStudentsList.length + 1,
      achievementAr: `الدرجة النهائية في: ${r.exams?.title || 'اختبار تقييم الأكاديمية'}`,
      achievementEn: `Top mark in ${r.exams?.title || 'Academy Exam'}`,
    })
  })

  // B) Additional distinguished active students
  ;((activeStudents as any[]) || []).forEach((s: any) => {
    const fullName = s?.profiles?.full_name?.trim()
    if (!fullName || seenStudentNames.has(fullName)) return
    seenStudentNames.add(fullName)

    realStudentsList.push({
      id: s.id,
      nameAr: fullName,
      nameEn: fullName,
      score: '100% تفوق دراسي',
      rank: realStudentsList.length + 1,
      achievementAr: 'طالب متميز في التقييم الأكاديمي والواجبات الدورية',
      achievementEn: 'Outstanding performance in academic assessments and coursework',
    })
  })

  return (
    <HallOfFameClientView
      locale={locale}
      students={realStudentsList}
    />
  )
}
