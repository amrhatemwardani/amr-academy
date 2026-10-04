import { redirect } from 'next/navigation'

export default async function StudentDossierPage({
  params,
}: {
  params: Promise<{ locale: string; studentId: string }>
}) {
  const { locale, studentId } = await params
  redirect(`/${locale}/students/${studentId}`)
}
