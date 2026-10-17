'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { teacherLogin, studentLogin, type LoginState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'student' | 'teacher'

interface LoginFormProps {
  locale: string
}

const initialState: LoginState = {}

export function LoginForm({ locale }: LoginFormProps) {
  // Default to student as requested
  const [tab, setTab] = useState<Tab>('student')
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
    ? 'تم تعليق الحساب. يرجى التواصل مع إدارة الأكاديمية.'
    : 'Your account has been suspended. Please contact the administrator.'

  return (
    <div className="rounded-md border border-border bg-card p-5 sm:p-6 shadow-sm">
      {/* Role Switcher Tabs (GitHub segmented style) */}
      <div className="flex border-b border-border mb-4 pb-2">
        <button
          type="button"
          onClick={() => setTab('student')}
          className={cn(
            'flex-1 text-center py-1.5 text-xs font-semibold rounded transition-colors',
            tab === 'student'
              ? 'text-foreground border-b-2 border-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {isAr ? 'حساب الطالب' : 'Student'}
        </button>
        <button
          type="button"
          onClick={() => setTab('teacher')}
          className={cn(
            'flex-1 text-center py-1.5 text-xs font-semibold rounded transition-colors',
            tab === 'teacher'
              ? 'text-foreground border-b-2 border-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {isAr ? 'حساب المعلم' : 'Teacher'}
        </button>
      </div>

      {/* Error alert */}
      {(state.error || (blockedParam && tab === 'student')) && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive"
        >
          {state.error || blockedMessage}
        </div>
      )}

      {/* Form */}
      <form action={action} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        {tab === 'teacher' ? (
          <div className="space-y-1.5">
            <Label htmlFor="teacher-email" className="text-xs font-medium text-foreground">
              {isAr ? 'البريد الإلكتروني' : 'Email address'}
            </Label>
            <Input
              id="teacher-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-describedby={state.fieldErrors?.email ? 'teacher-email-error' : undefined}
              className={cn(
                'h-9 rounded-md text-sm border-input bg-background',
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
            <Label htmlFor="student-identifier" className="text-xs font-medium text-foreground">
              {isAr ? 'كود الطالب أو رقم الهاتف' : 'Student code or phone'}
            </Label>
            <Input
              id="student-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder={isAr ? 'مثال: S1032' : 'e.g. S1032'}
              required
              aria-describedby={state.fieldErrors?.identifier ? 'identifier-error' : undefined}
              className={cn(
                'h-9 rounded-md text-sm border-input bg-background',
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
          <Label htmlFor="login-password" className="text-xs font-medium text-foreground">
            {isAr ? 'كلمة المرور' : 'Password'}
          </Label>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className={cn(
                'h-9 rounded-md pe-9 text-sm border-input bg-background',
                state.fieldErrors?.password && 'border-destructive'
              )}
              aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

        {/* GitHub Green Submit Button */}
        <Button
          type="submit"
          className="w-full h-9 rounded-md text-sm font-semibold text-white bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] transition-colors shadow-sm"
          loading={pending}
          disabled={pending}
        >
          {pending
            ? (isAr ? 'جاري الدخول...' : 'Signing in...')
            : (isAr ? 'تسجيل الدخول' : 'Sign in')}
        </Button>
      </form>
    </div>
  )
}
