import { createAdminClient } from '@/lib/supabase/admin'
import { LeaderboardStudent } from '@/components/leaderboard/LeaderboardClientView'

export async function getLeaderboardData(): Promise<{
  classes: { id: string; name: string }[]
  students: LeaderboardStudent[]
}> {
  const admin = await createAdminClient()

  // 1. Fetch active classes
  const { data: rawClasses } = await (admin.from('classes' as any) as any)
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const classes = ((rawClasses as any[]) || []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }))

  // 2. Fetch active students with profile and enrolled classes
  const { data: rawStudents } = await (admin.from('students' as any) as any)
    .select(`
      id, student_code, status,
      profiles ( full_name ),
      enrollments (
        classes ( name )
      )
    `)
    .eq('status', 'active')

  // 3. Fetch all exam results
  const { data: rawResults } = await (admin.from('exam_results' as any) as any)
    .select('student_id, percentage')
    .not('published_at', 'is', null)

  const examMap: Record<string, { total: number; sum: number }> = {}
  ;((rawResults as any[]) || []).forEach((r) => {
    if (!examMap[r.student_id]) {
      examMap[r.student_id] = { total: 0, sum: 0 }
    }
    examMap[r.student_id].total++
    examMap[r.student_id].sum += parseFloat(r.percentage) || 0
  })

  // 4. Fetch all attendance
  const { data: rawAttendance } = await (admin.from('attendance' as any) as any)
    .select('student_id, status')

  const attendanceMap: Record<string, { total: number; attended: number }> = {}
  ;((rawAttendance as any[]) || []).forEach((a) => {
    if (!attendanceMap[a.student_id]) {
      attendanceMap[a.student_id] = { total: 0, attended: 0 }
    }
    attendanceMap[a.student_id].total++
    if (a.status === 'present' || a.status === 'late') {
      attendanceMap[a.student_id].attended++
    }
  })

  // 5. Build students leaderboard objects
  const studentsList: LeaderboardStudent[] = ((rawStudents as any[]) || []).map((s: any) => {
    const sId = s.id
    const ex = examMap[sId] || { total: 0, sum: 0 }
    const examAverage = ex.total > 0 ? Math.round(ex.sum / ex.total) : 80 // fallback baseline

    const att = attendanceMap[sId] || { total: 0, attended: 0 }
    const attendanceRate = att.total > 0
      ? Math.round((att.attended / att.total) * 100)
      : 100

    const compositeScore = Math.round(examAverage * 0.7 + attendanceRate * 0.3)

    const classNames: string[] = (s.enrollments || [])
      .map((e: any) => e.classes?.name)
      .filter(Boolean)

    const badges: { labelEn: string; labelAr: string; icon: string; color: string }[] = []
    if (examAverage >= 90) {
      badges.push({
        labelEn: 'Top Scorer',
        labelAr: 'المتفوق الذهبي',
        icon: '🏆',
        color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
      })
    }
    if (attendanceRate >= 95) {
      badges.push({
        labelEn: '100% Attendance',
        labelAr: 'التزام تام',
        icon: '🌟',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
      })
    }
    if (compositeScore >= 90) {
      badges.push({
        labelEn: 'All-Star',
        labelAr: 'طالب مثالي',
        icon: '⭐',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300',
      })
    }

    return {
      id: sId,
      code: s.student_code || 'S0000',
      name: s.profiles?.full_name || 'Student',
      examAverage,
      examsCount: ex.total,
      attendanceRate,
      totalSessions: att.total,
      compositeScore,
      rank: 0,
      classes: classNames,
      badges,
    }
  })

  // Sort descending by compositeScore, then by examAverage
  studentsList.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore
    }
    return b.examAverage - a.examAverage
  })

  // Assign ranks
  studentsList.forEach((s, idx) => {
    s.rank = idx + 1
  })

  return { classes, students: studentsList }
}
