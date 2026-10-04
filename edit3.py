import os

page_path = r"c:\Users\hp\Documents\Amr Acadmy\src\app\[locale]\(teacher)\students\[studentId]\dossier\page.tsx"
os.makedirs(os.path.dirname(page_path), exist_ok=True)

content = """import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Student Dossier' }

export default async function StudentDossierPage({
  params,
}: {
  params: Promise<{ locale: string; studentId: string }>
}) {
  const { locale, studentId } = await params
  await requireTeacher(locale)

  const admin = createAdminClient()

  // 1. Profile
  const { data: student } = await (admin.from('students' as any) as any)
    .select(
      *,
      profiles:user_id(full_name, avatar_url)
    )
    .eq('id', studentId)
    .single()

  if (!student) notFound()

  // 2. Enrollments
  const { data: enrollments } = await (admin.from('enrollments' as any) as any)
    .select('*, classes(*)')
    .eq('student_id', studentId)

  // 3. Attendance
  const { data: attendance } = await (admin.from('attendance' as any) as any)
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(50)

  // 4. Payments
  const { data: payments } = await (admin.from('payments' as any) as any)
    .select('*')
    .eq('student_id', studentId)
    .order('paid_at', { ascending: false })

  // 5. Exam results
  const { data: examResults } = await (admin.from('exam_results' as any) as any)
    .select('*, exams(title)')
    .eq('student_id', studentId)

  // 6. Notes
  const { data: notes } = await (admin.from('student_notes' as any) as any)
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  const isAr = locale === 'ar'

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-white text-black min-h-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center print:hidden">
        <Link href={//students} className="text-blue-600 hover:underline">
          {isAr ? 'العودة للطلاب' : 'Back to Students'}
        </Link>
        <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white rounded">
          {isAr ? 'طباعة التقرير' : 'Print Dossier'}
        </button>
      </div>

      <div className="text-center border-b pb-6">
        <h1 className="text-3xl font-bold">{student.profiles?.full_name || 'Unknown'}</h1>
        <p className="text-gray-600 mt-2">Code: {student.student_code}</p>
        <p className="text-gray-600">Phone: {student.phone}</p>
        <p className="text-gray-600">Parent Phone: {student.parent_phone}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 border rounded">
          <p className="text-xl font-bold">{attendance?.length || 0}</p>
          <p className="text-sm text-gray-500">{isAr ? 'حصص الحضور' : 'Classes Attended'}</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-xl font-bold">{examResults?.length || 0}</p>
          <p className="text-sm text-gray-500">{isAr ? 'الامتحانات المجتازة' : 'Exams Taken'}</p>
        </div>
        <div className="p-4 border rounded">
          <p className="text-xl font-bold">{payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0}</p>
          <p className="text-sm text-gray-500">{isAr ? 'إجمالي المدفوعات' : 'Total Paid'}</p>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold border-b pb-2 mb-4">{isAr ? 'الفصول المسجلة' : 'Enrollments'}</h2>
        <ul className="list-disc list-inside">
          {enrollments?.map((e: any) => (
            <li key={e.id}>{e.classes?.name} - {e.classes?.subject}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold border-b pb-2 mb-4">{isAr ? 'نتائج الامتحانات' : 'Exam Results'}</h2>
        <div className="space-y-2">
          {examResults?.map((r: any) => (
            <div key={r.id} className="flex justify-between border-b pb-1">
              <span>{r.exams?.title}</span>
              <span className="font-bold">{r.score} / {r.max_score}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold border-b pb-2 mb-4">{isAr ? 'تاريخ الحضور (آخر 50)' : 'Attendance (Last 50)'}</h2>
        <div className="flex flex-wrap gap-2">
          {attendance?.map((a: any) => (
            <span key={a.id} className="px-2 py-1 text-sm bg-gray-100 rounded border">
              {a.date} ({a.status})
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold border-b pb-2 mb-4">{isAr ? 'المدفوعات' : 'Payments'}</h2>
        <ul className="list-disc list-inside">
          {payments?.map((p: any) => (
            <li key={p.id}>{new Date(p.paid_at).toLocaleDateString()} - {p.amount} {p.currency}</li>
          ))}
        </ul>
      </section>

      <section className="print:hidden">
        <h2 className="text-xl font-bold border-b pb-2 mb-4">{isAr ? 'ملاحظات المعلم' : 'Teacher Notes'}</h2>
        <div className="space-y-4">
          {notes?.map((n: any) => (
            <div key={n.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p>{n.note_text}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
"""

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

# Update routing in StudentsClientView.tsx
student_view = r"c:\Users\hp\Documents\Amr Acadmy\src\app\[locale]\(teacher)\students\StudentsClientView.tsx"
with open(student_view, "r", encoding="utf-8") as f:
    student_content = f.read()

student_content = student_content.replace(
    "onSelect={() => router.push(//students/)}",
    "onSelect={() => router.push(//students//dossier)}"
)

with open(student_view, "w", encoding="utf-8") as f:
    f.write(student_content)

print("Edit 3 done.")
