import { requireTeacher } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { StudentProfileClientView } from './StudentProfileClientView'

export const metadata: Metadata = { title: 'Student Dossier' }

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; studentId: string }>
}) {
  const { locale, studentId } = await params
  await requireTeacher(locale)

  const admin = createAdminClient()

  // 1. Fetch student & profile
  const { data: studentRow } = await (admin.from('students' as any) as any)
    .select(`
      id, student_code, phone, parent_phone, email, enrolled_on, status,
      profiles ( full_name, avatar_url )
    `)
    .eq('id', studentId)
    .single()

  if (!studentRow) {
    notFound()
  }

  // 2. Fetch Enrollments
  const { data: rawEnrollments } = await (admin.from('enrollments' as any) as any)
    .select(`
      id, enrolled_on, fee_override,
      classes ( id, name, subject, fee_structures ( amount ) )
    `)
    .eq('student_id', studentId)
    .is('left_on', null)

  const enrollments = ((rawEnrollments as any[]) || []).map((e: any) => {
    const feeStructures = e.classes?.fee_structures || []
    const defaultFee = feeStructures[0]?.amount ? parseFloat(feeStructures[0].amount) : 0
    const finalFee = e.fee_override !== null && e.fee_override !== undefined
      ? parseFloat(e.fee_override)
      : defaultFee

    return {
      classId: e.classes?.id || '',
      className: e.classes?.name || 'Class',
      subject: e.classes?.subject || '',
      enrolledOn: e.enrolled_on,
      fee: finalFee,
    }
  })

  // 3. Fetch Attendance
  const { data: rawAttendance } = await (admin.from('attendance' as any) as any)
    .select(`
      id, date, status, note,
      classes ( name )
    `)
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  const attendance = ((rawAttendance as any[]) || []).map((a: any) => ({
    id: a.id,
    date: a.date,
    status: a.status,
    note: a.note,
    className: a.classes?.name || 'Class',
  }))

  // 4. Fetch Charges
  const { data: rawCharges } = await (admin.from('charges' as any) as any)
    .select(`
      id, description, amount, due_date,
      classes ( name ),
      payment_allocations ( amount )
    `)
    .eq('student_id', studentId)
    .is('voided_at', null)
    .order('due_date', { ascending: false })

  const charges = ((rawCharges as any[]) || []).map((c: any) => {
    const totalAmount = parseFloat(c.amount) || 0
    const allocated = (c.payment_allocations || []).reduce(
      (sum: number, pa: any) => sum + (parseFloat(pa.amount) || 0),
      0
    )
    const remaining = Math.max(0, totalAmount - allocated)
    const status = remaining <= 0.01 ? 'paid' : allocated > 0 ? 'partial' : 'unpaid'

    return {
      id: c.id,
      description: c.description || 'Charge',
      className: c.classes?.name || '',
      amount: totalAmount,
      remaining,
      dueDate: c.due_date,
      status: status as 'paid' | 'partial' | 'unpaid',
    }
  })

  // 5. Fetch Payments
  const { data: rawPayments } = await (admin.from('payments' as any) as any)
    .select('id, receipt_no, amount, method, paid_at')
    .eq('student_id', studentId)
    .is('voided_at', null)
    .order('paid_at', { ascending: false })

  const payments = ((rawPayments as any[]) || []).map((p: any) => ({
    id: p.id,
    receiptNo: p.receipt_no,
    amount: parseFloat(p.amount) || 0,
    method: p.method,
    paidAt: p.paid_at,
  }))

  // 6. Fetch Exam Results
  const { data: rawResults } = await (admin.from('exam_results' as any) as any)
    .select(`
      attempt_id, exam_id, score, total, percentage, passed, published_at,
      exams ( title, classes ( name ) ),
      exam_attempts ( submitted_at )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  const examResults = ((rawResults as any[]) || []).map((r: any) => ({
    attemptId: r.attempt_id,
    examId: r.exam_id,
    examTitle: r.exams?.title || 'Exam',
    className: r.exams?.classes?.name || '',
    score: parseFloat(r.score) || 0,
    total: parseFloat(r.total) || 0,
    percentage: parseFloat(r.percentage) || 0,
    passed: r.passed,
    submittedAt: r.exam_attempts?.submitted_at || null,
    publishedAt: r.published_at,
  }))

  // 7. Fetch Notes
  const { data: rawNotes } = await (admin.from('student_notes' as any) as any)
    .select('id, note, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  const notes = ((rawNotes as any[]) || []).map((n: any) => ({
    id: n.id,
    note: n.note,
    createdAt: n.created_at,
    authorName: 'Teacher',
  }))

  // Calculate statistics
  const totalSessions = attendance.length
  const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'late').length
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100

  const examsCount = examResults.length
  const examAverage = examsCount > 0
    ? Math.round(examResults.reduce((acc, r) => acc + r.percentage, 0) / examsCount)
    : 0

  const outstandingBalance = charges.reduce((acc, c) => acc + c.remaining, 0)
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0)

  return (
    <StudentProfileClientView
      locale={locale}
      student={{
        id: studentRow.id,
        code: studentRow.student_code || 'S0000',
        fullName: studentRow.profiles?.full_name || 'Student',
        phone: studentRow.phone,
        parentPhone: studentRow.parent_phone,
        grade: enrollments[0]?.className || null,
        school: 'Amr Academy',
        status: studentRow.status,
        enrolledOn: studentRow.enrolled_on,
      }}
      enrollments={enrollments}
      attendance={attendance}
      charges={charges}
      payments={payments}
      examResults={examResults}
      notes={notes}
      stats={{
        attendanceRate,
        presentCount,
        totalSessions,
        examAverage,
        examsCount,
        outstandingBalance,
        totalPaid,
      }}
    />
  )
}
