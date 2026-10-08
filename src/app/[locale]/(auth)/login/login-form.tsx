'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { teacherLogin, studentLogin, type LoginState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  MessageCircle,
  Phone,
  Youtube,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'teacher' | 'student'

interface LoginFormProps {
  locale: string
}

const initialState: LoginState = {}

export function LoginForm({ locale }: LoginFormProps) {
  const [tab, setTab] = useState<Tab>('teacher')
  const [showPassword, setShowPassword] = useState(false)

  const [teacherState, teacherAction, teacherPending] = useActionState(
    teacherLogin,
    initialState
  )
  const [studentState, studentAction, studentPending] = useActionState(
    studentLogin,
    initialState
  )

  const state = tab === 'teacher' ? teacherState : studentState
  const action = tab === 'teacher' ? teacherAction : studentAction
  const pending = tab === 'teacher' ? teacherPending : studentPending

  const searchParams = useSearchParams()
  const blockedParam = searchParams.get('error') === 'blocked'
  const isAr = locale === 'ar'

  const blockedMessage = isAr
    ? 'تم تعليق الحساب. يرجى التواصل مع م. عمرو حاتم لإعادة التفعيل.'
    : 'Your account has been suspended. Please contact Eng. Amr Hatem for reactivation.'

  return (
    <div className="space-y-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5">
      {/* Header text */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {isAr ? 'تسجيل الدخول' : 'Welcome back'}
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm">
          {isAr
            ? 'سجل دخولك لمتابعة الحصص، الامتحانات، والواجبات الدراسية'
            : 'Sign in to access your dashboard, exams, and classes'}
        </p>
      </div>

      {/* Role Switcher Tabs */}
      <div className="grid grid-cols-2 p-1 gap-1 rounded-xl bg-muted/60 border border-border">
        <button
          type="button"
          onClick={() => setTab('teacher')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200',
            tab === 'teacher'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <GraduationCap className="h-4 w-4 text-indigo-500" />
          <span>{isAr ? 'بوابة المعلم' : 'Teacher Portal'}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('student')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200',
            tab === 'student'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span>{isAr ? 'بوابة الطالب' : 'Student Portal'}</span>
        </button>
      </div>

      {/* Error alert */}
      {(state.error || (blockedParam && tab === 'student')) && (
        <div
          role="alert"
          className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs sm:text-sm text-destructive leading-relaxed"
        >
          {state.error || blockedMessage}
        </div>
      )}

      {/* Sign-in Form */}
      <form action={action} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        {tab === 'teacher' ? (
          <div className="space-y-1.5">
            <Label htmlFor="teacher-email" className="text-xs font-semibold">
              {isAr ? 'البريد الإلكتروني للمعلم' : 'Teacher Email'}
            </Label>
            <Input
              id="teacher-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="engamrhatem@gmail.com"
              required
              aria-describedby={state.fieldErrors?.email ? 'teacher-email-error' : undefined}
              className={cn(
                'h-11 rounded-xl',
                state.fieldErrors?.email && 'border-destructive'
              )}
            />
            {state.fieldErrors?.email && (
              <p id="teacher-email-error" className="text-xs text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="student-identifier" className="text-xs font-semibold">
              {isAr ? 'كود الطالب أو رقم الهاتف' : 'Student Code or Phone Number'}
            </Label>
            <Input
              id="student-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder={isAr ? 'مثال: S1001 أو 01012345678' : 'e.g. S1001 or 01012345678'}
              required
              aria-describedby={state.fieldErrors?.identifier ? 'identifier-error' : undefined}
              className={cn(
                'h-11 rounded-xl',
                state.fieldErrors?.identifier && 'border-destructive'
              )}
            />
            {state.fieldErrors?.identifier && (
              <p id="identifier-error" className="text-xs text-destructive">
                {state.fieldErrors.identifier[0]}
              </p>
            )}
          </div>
        )}

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-xs font-semibold">
              {isAr ? 'كلمة المرور' : 'Password'}
            </Label>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className={cn(
                'h-11 rounded-xl pe-11',
                state.fieldErrors?.password && 'border-destructive'
              )}
              aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {state.fieldErrors?.password && (
            <p id="password-error" className="text-xs text-destructive">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 rounded-xl text-sm font-semibold shadow-md bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white"
          loading={pending}
          disabled={pending}
        >
          {pending
            ? (isAr ? 'جاري التحقق وتأكيد الدخول...' : 'Signing in...')
            : (isAr ? 'تسجيل الدخول' : 'Sign In')}
        </Button>
      </form>

      {/* Teacher Contact & YouTube Channel Card (Replaced Demo Credentials) */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 via-background to-purple-50/30 dark:from-indigo-950/20 dark:via-background dark:to-purple-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <HelpCircle className="h-4 w-4 text-indigo-500" />
          <span>{isAr ? 'للتواصل والاستفسار مع م. عمرو حاتم:' : 'Need help? Contact Eng. Amr Hatem:'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/201012006316"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-all hover:scale-[1.02]"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span dir="ltr">واتساب مباشر</span>
          </a>

          {/* YouTube Channel */}
          <a
            href="https://www.youtube.com/@Eng.AmrHatem"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold transition-all hover:scale-[1.02]"
          >
            <Youtube className="h-4 w-4 shrink-0" />
            <span>قناة اليوتيوب</span>
          </a>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
          <Phone className="h-3 w-3 text-indigo-500" />
          <span>{isAr ? 'هاتف / واتساب:' : 'Phone / WhatsApp:'}</span>
          <a href="tel:+201012006316" className="font-semibold text-foreground hover:underline" dir="ltr">
            +20 101 200 6316
          </a>
        </div>
      </div>
    </div>
  )
}
