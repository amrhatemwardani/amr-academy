'use client'

import { useActionState, useState } from 'react'
import { changePasswordAction, type ChangePasswordState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, ShieldCheck, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ChangePasswordFormProps {
  locale: string
  role?: string
}

const initialState: ChangePasswordState = {}

function getStrength(pass: string): { score: number; labelEn: string; labelAr: string; color: string } {
  if (!pass) return { score: 0, labelEn: '', labelAr: '', color: 'bg-muted' }
  let score = 0
  if (pass.length >= 6) score++
  if (pass.length >= 8) score++
  if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score++
  if (/[^a-zA-Z0-9]/.test(pass)) score++

  if (score <= 1) return { score: 1, labelEn: 'Weak', labelAr: 'ضعيفة', color: 'bg-destructive' }
  if (score === 2) return { score: 2, labelEn: 'Fair', labelAr: 'مقبولة', color: 'bg-amber-500' }
  if (score === 3) return { score: 3, labelEn: 'Good', labelAr: 'جيدة', color: 'bg-teal-500' }
  return { score: 4, labelEn: 'Strong', labelAr: 'قوية جداً', color: 'bg-emerald-500' }
}

export function ChangePasswordForm({ locale, role }: ChangePasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState
  )

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const isAr = locale === 'ar'
  const backHref = role === 'teacher' ? `/${locale}/dashboard` : `/${locale}/portal`
  const BackIcon = isAr ? ArrowRight : ArrowLeft
  const strength = getStrength(newPassword)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isAr ? 'تحديث كلمة المرور' : 'Change Password'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? 'اختر كلمة مرور قوية لحماية حسابك التعليمي'
              : 'Choose a strong password to protect your account'}
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
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

          {/* Password Strength Meter */}
          {newPassword && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{isAr ? 'قوة كلمة المرور:' : 'Strength:'}</span>
                <span className="font-semibold text-foreground">
                  {isAr ? strength.labelAr : strength.labelEn}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'rounded-full transition-all duration-300',
                      level <= strength.score ? strength.color : 'bg-muted'
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-0.5">
                <Check className={cn('h-3 w-3', newPassword.length >= 6 ? 'text-emerald-500' : 'text-muted-foreground/40')} />
                <span>{isAr ? 'على الأقل 6 خانات' : 'At least 6 characters'}</span>
              </div>
            </div>
          )}

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
          className="w-full h-11 rounded-xl text-sm font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 mt-2"
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
          <BackIcon className="h-3.5 w-3.5" />
          <span>{isAr ? 'العودة إلى الصفحة الرئيسية' : 'Back to home'}</span>
        </Link>
      </div>
    </div>
  )
}
