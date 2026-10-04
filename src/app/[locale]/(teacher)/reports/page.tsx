import { requireTeacher } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ReportsClientView } from './ReportsClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reports & Analytics' }

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const supabase = await createClient()

  // ── 1. Monthly revenue (last 6 months) ────────────────────────────
  const { data: rawPayments } = await (supabase.from('payments' as any) as any)
    .select('amount, paid_at, voided_at')
    .is('voided_at', null)
    .order('paid_at', { ascending: true })

  // ── 2. Attendance rate per class ───────────────────────────────────
  const { data: rawClasses } = await (supabase.from('classes' as any) as any)
    .select('id, name, is_active')
    .eq('is_active', true)

  const { data: rawAttendance } = await (supabase.from('attendance_records' as any) as any)
    .select('class_id, status')

  // ── 3. Top students with outstanding balances ──────────────────────
  const { data: rawCharges } = await (supabase.from('charge_status' as any) as any)
    .select(`
      student_id,
      remaining,
      students (
        student_code,
        profiles ( full_name )
      )
    `)
    .gt('remaining', 0)
    .order('remaining', { ascending: false })
    .limit(10)

  // ── 4. Student status distribution ────────────────────────────────
  const { data: rawStudents } = await (supabase.from('students' as any) as any)
    .select('status')

  // ────────────────────────────────────────────────────────────────────
  // Build monthly revenue buckets (last 6 months)
  const now = new Date()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyRevenue: { month: string; amount: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyRevenue.push({ month: monthNames[d.getMonth()], amount: 0 })
  }

  ;((rawPayments as any[]) || []).forEach((p) => {
    const d = new Date(p.paid_at)
    for (let i = 5; i >= 0; i--) {
      const target = new Date(now.getFullYear(), now.getMonth() - i, 1)
      if (d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth()) {
        monthlyRevenue[5 - i].amount += parseFloat(p.amount) || 0
      }
    }
  })

  // Build attendance rate per class
  const attendanceByClass: Record<string, { total: number; present: number; name: string }> = {}
  ;((rawClasses as any[]) || []).forEach((c) => {
    attendanceByClass[c.id] = { total: 0, present: 0, name: c.name }
  })
  ;((rawAttendance as any[]) || []).forEach((a) => {
    if (attendanceByClass[a.class_id]) {
      attendanceByClass[a.class_id].total++
      if (a.status === 'present' || a.status === 'late') {
        attendanceByClass[a.class_id].present++
      }
    }
  })

  const classAttendance = Object.values(attendanceByClass)
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: c.name,
      rate: Math.round((c.present / c.total) * 100),
    }))

  // Build top balances
  const seenStudents = new Set<string>()
  const topBalances: { student_code: string; full_name: string; balance: number }[] = []
  ;((rawCharges as any[]) || []).forEach((c) => {
    if (!seenStudents.has(c.student_id)) {
      seenStudents.add(c.student_id)
      topBalances.push({
        student_code: c.students?.student_code || '',
        full_name: c.students?.profiles?.full_name || 'Student',
        balance: parseFloat(c.remaining) || 0,
      })
    }
  })

  // Student status distribution
  const statusCount: Record<string, number> = {}
  ;((rawStudents as any[]) || []).forEach((s) => {
    statusCount[s.status] = (statusCount[s.status] || 0) + 1
  })
  const statusDistribution = Object.entries(statusCount).map(([name, value]) => ({ name, value }))

  // Total stats
  const totalCollected = ((rawPayments as any[]) || []).reduce(
    (sum: number, p: any) => sum + (parseFloat(p.amount) || 0),
    0,
  )
  const totalOutstanding = ((rawCharges as any[]) || []).reduce(
    (sum: number, c: any) => sum + (parseFloat(c.remaining) || 0),
    0,
  )

  return (
    <ReportsClientView
      locale={locale}
      monthlyRevenue={monthlyRevenue}
      classAttendance={classAttendance}
      topBalances={topBalances}
      statusDistribution={statusDistribution}
      stats={{
        totalCollected,
        totalOutstanding,
        totalStudents: ((rawStudents as any[]) || []).length,
        activeClasses: ((rawClasses as any[]) || []).length,
      }}
    />
  )
}
