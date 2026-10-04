import { requireStudent } from '@/lib/auth'
import { getLeaderboardData } from '@/lib/leaderboard/data'
import { LeaderboardClientView } from '@/components/leaderboard/LeaderboardClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Hall of Fame' }

export default async function StudentLeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)

  const { classes, students } = await getLeaderboardData()

  return (
    <LeaderboardClientView
      locale={locale}
      role="student"
      currentStudentId={user.id}
      classes={classes}
      students={students}
    />
  )
}
