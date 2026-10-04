import { requireTeacher } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { FinanceClientView, ChargeItem, PaymentItem } from './FinanceClientView'
import { StudentOption } from './RecordPaymentDialog'

export default async function FinancePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const supabase = await createClient()

  // 1. Fetch charge_status view
  const { data: rawCharges, error: chErr } = await (supabase.from('charge_status' as any) as any)
    .select(`
      id,
      student_id,
      amount,
      paid_amount,
      remaining,
      status,
      due_date,
      charges (
        description,
        classes (
          name
        )
      ),
      students (
        student_code,
        profiles (
          full_name
        )
      )
    `)
    .order('due_date', { ascending: false })

  if (chErr) {
    console.error('Error fetching charges:', chErr)
  }

  // 2. Fetch payments
  const { data: rawPayments, error: pErr } = await (supabase.from('payments' as any) as any)
    .select(`
      id,
      receipt_no,
      amount,
      method,
      paid_at,
      voided_at,
      students (
        student_code,
        profiles (
          full_name
        )
      )
    `)
    .order('paid_at', { ascending: false })

  if (pErr) {
    console.error('Error fetching payments:', pErr)
  }

  // 3. Fetch students with their total outstanding for payment dialog
  const { data: rawStudents } = await (supabase.from('students' as any) as any)
    .select(`
      id,
      student_code,
      profiles (
        full_name
      )
    `)
    .order('student_code', { ascending: true })

  // Map charges
  const charges: ChargeItem[] = ((rawCharges as any[]) || []).map((c) => ({
    id: c.id,
    student_id: c.student_id,
    student_code: c.students?.student_code || 'Unknown',
    student_name: c.students?.profiles?.full_name || 'Student',
    class_name: c.charges?.classes?.name || 'Class',
    description: c.charges?.description || 'Monthly fee',
    amount: parseFloat(c.amount) || 0,
    paid_amount: parseFloat(c.paid_amount) || 0,
    remaining: parseFloat(c.remaining) || 0,
    status: c.status || 'unpaid',
    due_date: c.due_date,
  }))

  // Map payments
  const payments: PaymentItem[] = ((rawPayments as any[]) || []).map((p) => ({
    id: p.id,
    receipt_no: p.receipt_no,
    student_name: p.students?.profiles?.full_name || 'Student',
    student_code: p.students?.student_code || '',
    amount: parseFloat(p.amount) || 0,
    method: p.method,
    paid_at: p.paid_at,
    voided_at: p.voided_at,
  }))

  // Calculate student outstanding balances
  const studentBalanceMap: Record<string, number> = {}
  charges.forEach((c) => {
    studentBalanceMap[c.student_id] = (studentBalanceMap[c.student_id] || 0) + c.remaining
  })

  const students: StudentOption[] = ((rawStudents as any[]) || []).map((s) => ({
    id: s.id,
    student_code: s.student_code,
    full_name: s.profiles?.full_name || 'Student',
    outstandingBalance: studentBalanceMap[s.id] || 0,
  }))

  // Calculate KPIs
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let collectedThisMonth = 0
  payments.forEach((p) => {
    if (!p.voided_at) {
      const pDate = new Date(p.paid_at)
      if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
        collectedThisMonth += p.amount
      }
    }
  })

  let totalOutstanding = 0
  let unpaidChargesCount = 0
  charges.forEach((c) => {
    totalOutstanding += c.remaining
    if (c.remaining > 0) unpaidChargesCount++
  })

  const stats = {
    collectedThisMonth,
    totalOutstanding,
    unpaidChargesCount,
    totalPaymentsCount: payments.filter((p) => !p.voided_at).length,
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <FinanceClientView
        stats={stats}
        students={students}
        charges={charges}
        payments={payments}
      />
    </div>
  )
}
