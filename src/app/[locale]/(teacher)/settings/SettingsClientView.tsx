'use client'

import { useState, useTransition, useRef } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Lock, Building2, CheckCircle2 } from 'lucide-react'
import { saveSettingsAction, changePasswordAction, updateProfileAction } from './actions'

// ── Types ─────────────────────────────────────────────────────────────
interface AcademySettings {
  school_name: string
  currency: string
  timezone: string
  min_attendance_pct: number
  consecutive_absences_alert: number
}

interface TeacherProfile {
  full_name: string
  avatar_url: string | null
  email: string
}

interface Props {
  locale: string
  settings: AcademySettings
  profile: TeacherProfile
}

// ── Input Component ───────────────────────────────────────────────────
function Field({
  label, name, type = 'text', defaultValue, min, max, step, hint,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string | number
  min?: number
  max?: number
  step?: number
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium leading-none">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ── Select Component ──────────────────────────────────────────────────
function SelectField({
  label, name, defaultValue, options,
}: {
  label: string
  name: string
  defaultValue?: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium leading-none">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────
export function SettingsClientView({ locale, settings, profile }: Props) {
  const isAr = locale === 'ar'
  const [settingsPending, startSettings] = useTransition()
  const [profilePending, startProfile] = useTransition()
  const [pwPending, startPw] = useTransition()
  const pwFormRef = useRef<HTMLFormElement>(null)

  // ── Save Academy Settings ─────────────────────────────────────────
  function handleSettings(formData: FormData) {
    startSettings(async () => {
      const res = await saveSettingsAction(formData)
      if (res?.error) toast.error(res.error)
      else toast.success(isAr ? 'تم حفظ الإعدادات' : 'Settings saved successfully')
    })
  }

  // ── Update Profile ────────────────────────────────────────────────
  function handleProfile(formData: FormData) {
    startProfile(async () => {
      const res = await updateProfileAction(formData)
      if (res?.error) toast.error(res.error)
      else toast.success(isAr ? 'تم تحديث الملف الشخصي' : 'Profile updated')
    })
  }

  // ── Change Password ───────────────────────────────────────────────
  function handlePassword(formData: FormData) {
    startPw(async () => {
      const res = await changePasswordAction(formData)
      if (res?.error) toast.error(res.error)
      else {
        toast.success(isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully')
        pwFormRef.current?.reset()
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          {isAr ? 'الإعدادات' : 'Settings'}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {isAr ? 'إدارة إعدادات الأكاديمية وحسابك' : 'Manage academy settings and your account'}
        </p>
      </div>

      {/* ── Academy Settings ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            {isAr ? 'إعدادات الأكاديمية' : 'Academy Settings'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'المعلومات الأساسية وقواعد التنبيه' : 'Basic information and alert rules'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSettings} className="space-y-4">
            <Field
              label={isAr ? 'اسم الأكاديمية' : 'School Name'}
              name="school_name"
              defaultValue={settings.school_name}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label={isAr ? 'العملة' : 'Currency'}
                name="currency"
                defaultValue={settings.currency}
                options={[
                  { value: 'EGP', label: 'EGP — Egyptian Pound' },
                  { value: 'USD', label: 'USD — US Dollar' },
                  { value: 'SAR', label: 'SAR — Saudi Riyal' },
                  { value: 'AED', label: 'AED — UAE Dirham' },
                ]}
              />
              <SelectField
                label={isAr ? 'المنطقة الزمنية' : 'Timezone'}
                name="timezone"
                defaultValue={settings.timezone}
                options={[
                  { value: 'Africa/Cairo', label: 'Cairo (UTC+2/3)' },
                  { value: 'Asia/Riyadh', label: 'Riyadh (UTC+3)' },
                  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
                  { value: 'Europe/London', label: 'London (UTC+0/1)' },
                  { value: 'UTC', label: 'UTC' },
                ]}
              />
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
                {isAr ? 'قواعد التنبيه' : 'Alert Rules'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label={isAr ? 'الحد الأدنى للحضور (%)' : 'Min. Attendance (%)'}
                  name="min_attendance_pct"
                  type="number"
                  defaultValue={settings.min_attendance_pct}
                  min={0}
                  max={100}
                  step={5}
                  hint={isAr ? 'تنبيه إذا انخفض الحضور عن هذه النسبة' : 'Alert if attendance drops below this'}
                />
                <Field
                  label={isAr ? 'تنبيه الغياب المتتالي (أيام)' : 'Consecutive Absences Alert'}
                  name="consecutive_absences_alert"
                  type="number"
                  defaultValue={settings.consecutive_absences_alert}
                  min={1}
                  max={30}
                  hint={isAr ? 'تنبيه بعد هذا العدد من الغيابات المتتالية' : 'Alert after this many consecutive absences'}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={settingsPending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {settingsPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Teacher Profile ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-indigo-600" />
            {isAr ? 'الملف الشخصي' : 'My Profile'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'تعديل اسمك المعروض' : 'Update your display name'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
              <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                {profile.email}
                <Badge variant="outline" className="ms-2 text-xs">
                  {isAr ? 'لا يمكن تغييره' : 'Read-only'}
                </Badge>
              </div>
            </div>
            <Field
              label={isAr ? 'الاسم الكامل' : 'Full Name'}
              name="full_name"
              defaultValue={profile.full_name}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profilePending}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {profilePending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {isAr ? 'تحديث الملف الشخصي' : 'Update Profile'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Change Password ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-amber-600" />
            {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
          </CardTitle>
          <CardDescription>
            {isAr ? 'يجب إدخال كلمة المرور الحالية للتأكيد' : 'Enter your current password to confirm changes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={pwFormRef} action={handlePassword} className="space-y-4">
            <Field
              label={isAr ? 'كلمة المرور الحالية' : 'Current Password'}
              name="current_password"
              type="password"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                name="new_password"
                type="password"
                hint={isAr ? '8 أحرف على الأقل' : 'At least 8 characters'}
              />
              <Field
                label={isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                name="confirm_password"
                type="password"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwPending}
                className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60 transition-colors"
              >
                {pwPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
