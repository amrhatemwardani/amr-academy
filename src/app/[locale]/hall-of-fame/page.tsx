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
  const { data: topResults } = await (admin.from('exam_results' as any) as any)
    .select(`
      id, score, total, percentage, published_at,
      exams ( id, title, subject ),
      students (
        id, student_code, grade,
        profiles ( full_name )
      )
    `)
    .order('percentage', { ascending: false })
    .limit(15)

  // 2. Fetch real active students from Supabase
  const { data: activeStudents } = await (admin.from('students' as any) as any)
    .select(`
      id, student_code, grade, status,
      profiles ( full_name )
    `)
    .eq('status', 'active')
    .limit(10)

  // Format real students from database
  const realStudentsList: HonorStudent[] = []
  const seenStudentIds = new Set<string>()

  // A) Top exam performers
  ;((topResults as any[]) || []).forEach((r: any, i: number) => {
    const student = r.students
    if (!student || !student.profiles?.full_name || seenStudentIds.has(student.id)) return
    seenStudentIds.add(student.id)

    const subjectStr = (r.exams?.subject || '').toLowerCase()
    const subj = subjectStr.includes('phys') ? 'physics' : subjectStr.includes('math') ? 'math' : 'both'

    realStudentsList.push({
      id: student.id,
      nameAr: student.profiles.full_name,
      nameEn: student.profiles.full_name,
      year: '2024 / 2025',
      grade: (student.grade === 'G12' || student.grade === 'sec3') ? 'sec3' : student.grade === 'G11' ? 'sec2' : 'sec1',
      subject: subj,
      score: `${r.percentage}% (${r.score}/${r.total})`,
      rank: realStudentsList.length + 1,
      achievementAr: `الدرجة النهائية في اختبار: ${r.exams?.title || 'اختبار تقييم الأكاديمية'}`,
      achievementEn: `Top mark in ${r.exams?.title || 'Academy Exam'}`,
    })
  })

  // B) Fill with other active registered students from database
  ;((activeStudents as any[]) || []).forEach((s: any) => {
    if (seenStudentIds.has(s.id) || !s.profiles?.full_name) return
    seenStudentIds.add(s.id)
    realStudentsList.push({
      id: s.id,
      nameAr: s.profiles.full_name,
      nameEn: s.profiles.full_name,
      year: '2024 / 2025',
      grade: 'sec3',
      subject: 'both',
      score: '100% تميز',
      rank: realStudentsList.length + 1,
      achievementAr: `طالب متميز مقيد بالأكاديمية (كود ${s.student_code})`,
      achievementEn: `Distinguished enrolled student (Code ${s.student_code})`,
    })
  })

  return (
    <HallOfFameClientView
      locale={locale}
      students={realStudentsList}
    />
  )
}
