'use client'

import { useActionState, useState } from 'react'
import { changePasswordAction, type ChangePasswordState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, CheckCircle2, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ChangePasswordFormProps {
  locale: string
  role?: string
}

const initialState: ChangePasswordState = {}

export function ChangePasswordForm({ locale, role }: ChangePasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState
  )

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isAr = locale === 'ar'
  const backHref = role === 'teacher' ? `/${locale}/dashboard` : `/${locale}/portal`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isAr ? 'تحديث كلمة المرور' : 'Change Password'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? 'اختر كلمة مرور قوية مكونة من 6 خانات أو أكثر'
              : 'Choose a strong password with at least 6 characters'}
          </p>
        </div>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs sm:text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        {/* Current Password */}
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword" className="text-xs font-semibold">
            {isAr ? 'كلمة المرور الحالية' : 'Current Password'}
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className={cn(
                'h-11 rounded-xl pe-11',
                state.fieldErrors?.currentPassword && 'border-destructive'
              )}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {state.fieldErrors?.currentPassword && (
            <p className="text-xs text-destructive">{state.fieldErrors.currentPassword[0]}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-xs font-semibold">
            {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={6}
              className={cn(
                'h-11 rounded-xl pe-11',
                state.fieldErrors?.newPassword && 'border-destructive'
              )}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {state.fieldErrors?.newPassword && (
            <p className="text-xs text-destructive">{state.fieldErrors.newPassword[0]}</p>
          )}
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold">
            {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={6}
              className={cn(
                'h-11 rounded-xl pe-11',
                state.fieldErrors?.confirmPassword && 'border-destructive'
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {state.fieldErrors?.confirmPassword && (
            <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 rounded-xl text-sm font-semibold shadow-md bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white mt-2"
          loading={isPending}
          disabled={isPending}
        >
          {isPending
            ? (isAr ? 'جاري حفظ كلمة المرور الجديدة...' : 'Updating password...')
            : (isAr ? 'حفظ وتحديث كلمة المرور' : 'Save New Password')}
        </Button>
      </form>

      {/* Return to Dashboard link */}
      <div className="pt-2 text-center">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          {isAr ? (
            <>
              <span>العودة إلى الصفحة الرئيسية</span>
              <ArrowLeft className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to home</span>
            </>
          )}
        </Link>
      </div>
    </div>
  )
}
