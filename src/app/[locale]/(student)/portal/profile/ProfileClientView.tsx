'use client'

import { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { User, Phone, Lock, School, GraduationCap, ShieldCheck, KeyRound, CheckCircle2, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { changeStudentPasswordAction } from './actions'

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

            <Link
              href={`/${locale}/portal/id-card`}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90 transition-colors shrink-0"
            >
              <CreditCard className="h-4 w-4" />
              <span>{isAr ? 'كارنيه الطالب الذكي' : 'Digital Student ID'}</span>
            </Link>
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
    </div>
  )
}
