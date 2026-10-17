'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { User, Phone, School, GraduationCap, KeyRound, CreditCard, ScanFace, Trash2, ShieldCheck, Smartphone, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { changeStudentPasswordAction } from './actions'
import {
  getEnrolledBiometric,
  removeEnrolledBiometric,
  isPlatformAuthenticatorAvailable,
  type EnrolledBiometricProfile,
} from '@/lib/auth/webauthn'
import { FaceIdLoginModal } from '@/components/auth/FaceIdLoginModal'
import { disableFaceIdAction } from '@/app/[locale]/(auth)/login/face-id-actions'

interface Props {
  locale: string
  student: {
    fullName: string
    studentCode: string
    phone: string | null
    parentPhone: string | null
    grade: string | null
    school: string | null
    status: string
  }
}

export function ProfileClientView({ locale, student }: Props) {
  const isAr = locale === 'ar'
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // Face ID state
  const [enrolledBiometric, setEnrolledBiometric] = useState<EnrolledBiometricProfile | null>(null)
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [removingFaceId, setRemovingFaceId] = useState(false)

  useEffect(() => {
    // Load enrolled biometric from localStorage
    const enrolled = getEnrolledBiometric()
    setEnrolledBiometric(enrolled)
    // Check platform support
    isPlatformAuthenticatorAvailable().then(setBiometricSupported)
  }, [])

  async function handleRemoveFaceId() {
    setRemovingFaceId(true)
    try {
      removeEnrolledBiometric()
      await disableFaceIdAction(student.studentCode)
      setEnrolledBiometric(null)
      toast.success(isAr ? 'تم إلغاء تفعيل بصمة الوجه' : 'Face ID removed successfully')
    } catch {
      toast.error(isAr ? 'حدث خطأ أثناء الإلغاء' : 'Failed to remove Face ID')
    } finally {
      setRemovingFaceId(false)
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await changeStudentPasswordAction(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(
          isAr
            ? 'تم تحديث كلمة المرور بنجاح!'
            : 'Password updated successfully!'
        )
        formRef.current?.reset()
      }
    })
  }

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          {isAr ? 'الملف الشخصي' : 'My Profile'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isAr ? 'بيانات حساب الطالب وإعدادات الأمان' : 'Student account information & security'}
        </p>
      </div>

      {/* Student Details Card */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <CardTitle className="text-base font-bold">{student.fullName}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="font-mono text-xs">
                    {student.studentCode}
                  </Badge>
                  <Badge className="bg-emerald-600 text-white text-[10px]">
                    {student.status === 'active' ? (isAr ? 'نشط' : 'Active') : student.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Link
                href={`/${locale}/portal/id-card`}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90 transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                <span>{isAr ? 'كارنيه الطالب الذكي' : 'Digital Student ID'}</span>
              </Link>

              <Link
                href={`/${locale}/portal/certificates`}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                <Award className="h-4 w-4" />
                <span>{isAr ? 'شهادات التقدير' : 'Certificates'}</span>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/20">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">{isAr ? 'رقم الهاتف' : 'Phone'}</p>
                <p className="font-medium text-xs mt-0.5">{student.phone || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/20">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">{isAr ? 'هاتف ولي الأمر' : 'Parent Phone'}</p>
                <p className="font-medium text-xs mt-0.5">{student.parentPhone || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/20">
              <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">{isAr ? 'الصف الدراسي' : 'Grade'}</p>
                <p className="font-medium text-xs mt-0.5">{student.grade || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/20">
              <School className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">{isAr ? 'المدرسة' : 'School'}</p>
                <p className="font-medium text-xs mt-0.5">{student.school || '—'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Face ID / Biometrics Card */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-amber-500" />
              {isAr ? 'تسجيل الدخول ببصمة الوجه (Face ID)' : 'Face ID / Biometric Login'}
            </CardTitle>
            <Badge
              variant="outline"
              className={
                enrolledBiometric
                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'border-muted text-muted-foreground'
              }
            >
              {enrolledBiometric
                ? isAr
                  ? 'مفعل على هذا الجهاز ✓'
                  : 'Enabled on this device ✓'
                : isAr
                ? 'غير مفعل'
                : 'Not configured'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {isAr
              ? 'تسجيل الدخول الفوري بضغطة زر أو التعرف على الوجه عبر الكاميرا دون الحاجة لكتابة كلمة المرور كل مرة.'
              : 'Log in instantly using Face ID, device biometrics, or camera recognition without typing your password.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {enrolledBiometric ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">
                    {enrolledBiometric.deviceName || (isAr ? 'هذا الجهاز' : 'This device')}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isAr ? 'كود الطالب:' : 'Student Code:'} {enrolledBiometric.identifier} •{' '}
                    {new Date(enrolledBiometric.enrolledAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted font-bold text-xs transition-colors"
                >
                  <ScanFace className="h-4 w-4 text-amber-500" />
                  <span>{isAr ? 'اختبار / إعادة تعيين Face ID' : 'Test / Re-enroll Face ID'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFaceId}
                  disabled={removingFaceId}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-bold text-xs transition-colors disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isAr ? 'إلغاء التفعيل' : 'Remove Face ID'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                {isAr
                  ? 'قم بتفعيل Face ID للوصول الفوري لبوابتك التعليمية بنقرة واحدة أو التعرف على ملامح وجهك.'
                  : 'Enable Face ID to access your student portal with one click or facial recognition.'}
              </div>

              <button
                type="button"
                onClick={() => setShowEnrollModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-sm hover:from-amber-600 hover:to-orange-600 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <ScanFace className="h-4 w-4" />
                <span>{isAr ? 'تفعيل Face ID على هذا الجهاز الآن ⚡' : 'Activate Face ID on this device ⚡'}</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? 'أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة.'
              : 'Enter your current password then pick a new password.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form ref={formRef} action={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {isAr ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <input
                type="password"
                name="current_password"
                required
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <input
                type="password"
                name="new_password"
                required
                minLength={6}
                placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                name="confirm_password"
                required
                minLength={6}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending && <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />}
                <span>{isAr ? 'تحديث كلمة المرور' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Face ID Enrollment / Testing Modal */}
      <FaceIdLoginModal
        locale={locale}
        isOpen={showEnrollModal}
        onClose={() => {
          setShowEnrollModal(false)
          setEnrolledBiometric(getEnrolledBiometric())
        }}
        initialIdentifier={student.studentCode}
      />
    </div>
  )
}
