import { createAdminClient } from '@/lib/supabase/admin'
import { CertificateVerificationClientView } from './CertificateVerificationClientView'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>
}): Promise<Metadata> {
  const { locale, code } = await params
  return {
    title: locale === 'ar'
      ? `التحقق من الشهادة الرقمية (${code}) | أكاديمية م. عمرو حاتم`
      : `Certificate Verification (${code}) | Eng. Amr Hatem Academy`,
    description: locale === 'ar'
      ? `صفحة التحقق الرسمية المعتمدة لشهادات التقدير الصادرة من أكاديمية المهندس عمرو حاتم للفيزياء والرياضيات.`
      : `Official verification portal for credentials issued by Eng. Amr Hatem Academy.`,
  }
}

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>
}) {
  const { locale, code } = await params
  const isAr = locale === 'ar'

  // Extract student code from verification code (e.g., AMR-CERT-2026-S1036 -> S1036)
  const codeClean = decodeURIComponent(code).trim().toUpperCase()
  const match = codeClean.match(/S\d+/i)
  const studentCode = match ? match[0].toUpperCase() : codeClean

  const admin = createAdminClient()

  // Query student
  const { data: student } = await (admin.from('students' as any) as any)
    .select(`
      id, student_code, enrolled_on, status,
      profiles ( full_name )
    `)
    .ilike('student_code', studentCode)
    .single()

  let topExamScore = 100
  let topExamTitle = isAr ? 'امتحان الفيزياء الشامل' : 'Comprehensive Physics Exam'

  if (student?.id) {
    const { data: results } = await (admin.from('exam_results' as any) as any)
      .select('score, total, percentage, exams(title)')
      .eq('student_id', student.id)
      .not('published_at', 'is', null)
      .order('percentage', { ascending: false })
      .limit(1)

    if (results && results.length > 0) {
      topExamScore = Math.round(parseFloat(results[0].percentage) || 100)
      if (results[0].exams?.title) {
        topExamTitle = results[0].exams.title
      }
    }
  }

  const isValid = !!student && student.status === 'active'

  const studentName = (student as any)?.profiles?.full_name || (isValid ? 'طالب متميز' : 'غير معروف')

  return (
    <CertificateVerificationClientView
      locale={locale}
      code={codeClean}
      isValid={isValid}
      student={
        isValid
          ? {
              code: student.student_code,
              name: studentName,
              enrolledOn: student.enrolled_on,
              topScore: topExamScore,
              topExamTitle,
            }
          : null
      }
    />
  )
}
