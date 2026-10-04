import { requireTeacher } from '@/lib/auth'
import { getLeaderboardData } from '@/lib/leaderboard/data'
import { LeaderboardClientView } from '@/components/leaderboard/LeaderboardClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Academic Leaderboard' }

export default async function TeacherLeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const { classes, students } = await getLeaderboardData()

  return (
    <LeaderboardClientView
      locale={locale}
      role="teacher"
      classes={classes}
      students={students}
    />
  )
}
