'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { teacherLogin, studentLogin, type LoginState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, GraduationCap, BookOpen } from 'lucide-react'
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
    ? 'تم حظر / تعليق حسابك. يرجى التواصل مع إدارة الأكاديمية أو المعلم لإعادة التفعيل.'
    : 'Your account has been suspended/blocked. Please contact the manager or your teacher to reactivate your account.'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border bg-muted p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab('teacher')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all duration-150',
            tab === 'teacher'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <GraduationCap className="h-4 w-4" />
          Teacher
        </button>
        <button
          type="button"
          onClick={() => setTab('student')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all duration-150',
            tab === 'student'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Student
        </button>
      </div>

      {/* Error message */}
      {(state.error || (blockedParam && tab === 'student')) && (
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
        >
          {state.error || blockedMessage}
        </div>
      )}

      {/* Form */}
      <form action={action} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        {tab === 'teacher' ? (
          <div className="space-y-2">
            <Label htmlFor="teacher-email">Email</Label>
            <Input
              id="teacher-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="teacher@example.com"
              required
              aria-describedby={state.fieldErrors?.email ? 'teacher-email-error' : undefined}
              className={cn(state.fieldErrors?.email && 'border-destructive')}
            />
            {state.fieldErrors?.email && (
              <p id="teacher-email-error" className="text-xs text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="student-identifier">Student Code or Phone</Label>
            <Input
              id="student-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="S1001 or 01012345678"
              required
              aria-describedby={state.fieldErrors?.identifier ? 'identifier-error' : undefined}
              className={cn(state.fieldErrors?.identifier && 'border-destructive')}
            />
            {state.fieldErrors?.identifier && (
              <p id="identifier-error" className="text-xs text-destructive">
                {state.fieldErrors.identifier[0]}
              </p>
            )}
          </div>
        )}

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="pe-10"
              aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

        <Button
          type="submit"
          className="w-full"
          loading={pending}
          disabled={pending}
        >
          {pending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Hint for demo */}
      <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Demo credentials:</p>
        <p>Teacher: teacher@amracademy.local / Teacher@2024!</p>
        <p>Student: S1001 / Student@2024!</p>
      </div>
    </div>
  )
}
