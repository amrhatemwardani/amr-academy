import { requireTeacher } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SettingsClientView } from './SettingsClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireTeacher(locale)

  const supabase = await createClient()
  const admin = await createAdminClient()

  // Load settings row
  const { data: settingsRow } = await (supabase.from('settings' as any) as any)
    .select('*')
    .eq('id', 1)
    .single()

  // Load teacher profile
  const { data: profileRow } = await (admin.from('profiles' as any) as any)
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const settings = settingsRow || {
    school_name: 'Eng. Amr Hatem Academy',
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    min_attendance_pct: 75,
    consecutive_absences_alert: 3,
  }

  return (
    <SettingsClientView
      locale={locale}
      settings={settings}
      profile={{
        full_name: profileRow?.full_name || user.fullName,
        avatar_url: profileRow?.avatar_url || null,
        email: user.email ?? '',
      }}
    />
  )
}
