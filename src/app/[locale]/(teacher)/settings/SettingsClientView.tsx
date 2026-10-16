'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Lock, Building2, CheckCircle2, Palette, Sparkles, Upload, Eye } from 'lucide-react'
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

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [brandName, setBrandName] = useState(settings.school_name || 'أكاديمية م. عمرو حاتم')
  const [tagline, setTagline] = useState('Physics & Mathematics Academy')

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoPreview(URL.createObjectURL(file))
      toast.info(isAr ? 'تم تجهيز معاينة اللوجو' : 'Logo preview loaded')
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerPreview(URL.createObjectURL(file))
      toast.info(isAr ? 'تم تجهيز معاينة البانر' : 'Banner preview loaded')
    }
  }

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

      {/* ── Branding & Visual Identity ────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" />
            {isAr ? 'الهوية البصرية والمظهر الأكاديمي' : 'Branding & Visual Identity'}
          </CardTitle>
          <CardDescription>
            {isAr
              ? 'معاينة وإدارة اللوجو والبانر وألوان الأكاديمية مع معاينة حية'
              : 'Preview and manage academy logo, banner, and academic color palette'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Palette Swatches */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2.5">
              {isAr ? 'باليت الألوان المعتمدة (WCAG AA)' : 'Academic Color Palette (WCAG AA)'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="rounded-xl border border-border p-2.5 bg-[#0F2A4A] text-white space-y-1">
                <span className="text-[10px] uppercase font-bold opacity-80">{isAr ? 'الأساسي' : 'Primary'}</span>
                <p className="text-xs font-mono font-bold">#0F2A4A</p>
                <p className="text-[10px] opacity-75">Deep Navy</p>
              </div>
              <div className="rounded-xl border border-border p-2.5 bg-[#14A3A3] text-white space-y-1">
                <span className="text-[10px] uppercase font-bold opacity-80">{isAr ? 'الثانوي' : 'Secondary'}</span>
                <p className="text-xs font-mono font-bold">#14A3A3</p>
                <p className="text-[10px] opacity-75">Teal</p>
              </div>
              <div className="rounded-xl border border-border p-2.5 bg-[#F2B134] text-[#0F2A4A] space-y-1">
                <span className="text-[10px] uppercase font-bold opacity-80">{isAr ? 'التمييز' : 'Accent'}</span>
                <p className="text-xs font-mono font-bold">#F2B134</p>
                <p className="text-[10px] opacity-75">Warm Gold</p>
              </div>
              <div className="rounded-xl border border-border p-2.5 bg-[#F7F9FC] text-[#1E293B] space-y-1">
                <span className="text-[10px] uppercase font-bold opacity-80">{isAr ? 'الخلفية' : 'Background'}</span>
                <p className="text-xs font-mono font-bold">#F7F9FC</p>
                <p className="text-[10px] opacity-75">Off-white</p>
              </div>
              <div className="rounded-xl border border-border p-2.5 bg-[#1E293B] text-white space-y-1">
                <span className="text-[10px] uppercase font-bold opacity-80">{isAr ? 'النصوص' : 'Text'}</span>
                <p className="text-xs font-mono font-bold">#1E293B</p>
                <p className="text-[10px] opacity-75">Dark Slate</p>
              </div>
            </div>
          </div>

          {/* Logo & Banner Uploaders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            {/* Logo Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-primary" />
                <span>{isAr ? 'تحديث ملف اللوجو' : 'Upload Logo'}</span>
              </label>
              <input
                type="file"
                accept="image/*,.svg"
                onChange={handleLogoChange}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-semibold file:bg-muted hover:file:bg-muted/80 w-full"
              />
              <p className="text-[11px] text-muted-foreground">
                {isAr ? 'يدعم SVG أو PNG أو WebP عالي الدقة' : 'Supports SVG, PNG, or high-res WebP'}
              </p>
            </div>

            {/* Banner Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-secondary" />
                <span>{isAr ? 'تحديث صورة البانر' : 'Upload Banner'}</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-semibold file:bg-muted hover:file:bg-muted/80 w-full"
              />
              <p className="text-[11px] text-muted-foreground">
                {isAr ? 'صورة عريضة للـ Hero واليوتيوب' : 'Wide landscape image for Hero section'}
              </p>
            </div>
          </div>

          {/* Live Component Preview */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>{isAr ? 'معاينة حية للمظهر (Live Preview)' : 'Live UI Component Preview'}</span>
            </div>

            <div className="rounded-2xl border border-border bg-gradient-to-br from-[#07172B] via-[#0F2A4A] to-[#0D223B] p-5 text-white shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 relative rounded-xl overflow-hidden bg-white/10 p-1 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview || '/logo-icon.svg'}
                      alt="Logo Preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{brandName}</p>
                    <p className="text-[11px] text-[#F2B134] font-semibold">{tagline}</p>
                  </div>
                </div>

                <span className="rounded-full bg-[#F2B134] text-[#0F2A4A] px-2.5 py-0.5 text-[10px] font-bold">
                  {isAr ? 'معاينة مباشرة' : 'Live Mock'}
                </span>
              </div>

              {bannerPreview && (
                <div className="rounded-xl overflow-hidden border border-white/10 max-h-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-300">
                  {isAr ? 'تجربة أزرار وهوية المنصة الأكاديمية' : 'Academic UI buttons & styling sample'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-[#F2B134] text-[#0F2A4A] px-3 py-1.5 text-xs font-bold shadow hover:opacity-90"
                  >
                    {isAr ? 'زر متميز' : 'Accent Action'}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-[#14A3A3] text-white px-3 py-1.5 text-xs font-semibold shadow hover:opacity-90"
                  >
                    {isAr ? 'زر تفاعلي' : 'Secondary Action'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
