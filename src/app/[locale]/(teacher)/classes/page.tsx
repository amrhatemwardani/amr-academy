import { requireTeacher } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ClassesClientView, ClassCardItem } from './ClassesClientView'

export default async function ClassesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const supabase = await createClient()

  // 1. Fetch classes
  const { data: rawClasses, error: cErr } = await (supabase.from('classes' as any) as any)
    .select(`
      id,
      name,
      subject,
      level,
      schedule,
      is_active,
      fee_structures (
        kind,
        amount
      ),
      enrollments (
        student_id,
        left_on
      )
    `)
    .order('created_at', { ascending: true })

  if (cErr) {
    console.error('Error fetching classes:', cErr)
  }

  const classes: ClassCardItem[] = ((rawClasses as any[]) || []).map((c) => {
    // Find monthly fee
    const fees = (c.fee_structures as any[]) || []
    const monthly = fees.find((f) => f.kind === 'monthly')
    const monthlyFee = monthly ? parseFloat(monthly.amount) : 0

    // Count active enrollments
    const enrollments = (c.enrollments as any[]) || []
    const activeEnrollments = enrollments.filter((e) => !e.left_on)

    return {
      id: c.id,
      name: c.name,
      subject: c.subject,
      level: c.level,
      is_active: c.is_active,
      schedule: Array.isArray(c.schedule) ? c.schedule : [],
      monthlyFee,
      enrolledCount: activeEnrollments.length,
    }
  })

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <ClassesClientView classes={classes} />
    </div>
  )
}
