'use client'

import { useActionState, useState } from 'react'
import { changePasswordAction, type ChangePasswordState } from './actions'
import { Eye, EyeOff, ShieldCheck, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
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

  if (score <= 1) return { score: 1, labelEn: 'Weak', labelAr: 'ضعيفة', color: 'bg-red-500' }
  if (score === 2) return { score: 2, labelEn: 'Fair', labelAr: 'مقبولة', color: 'bg-[#f6b407]' }
  if (score === 3) return { score: 3, labelEn: 'Good', labelAr: 'جيدة جداً', color: 'bg-[#0050e3]' }
  return { score: 4, labelEn: 'Strong', labelAr: 'قوية وممتازة 🛡️', color: 'bg-[#00e2ae]' }
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
    <div className="space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff8e1] border-2 border-[#f6b407] text-[#c48b05]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900">
            {isAr ? 'تحديث كلمة المرور' : 'Change Password'}
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            {isAr
              ? 'اختر كلمة مرور قوية لحماية حسابك التعليمي'
              : 'Choose a strong password to protect your account'}
          </p>
        </div>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600 text-center"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        {/* Current Password */}
        <div className="space-y-1">
          <label htmlFor="currentPassword" className="text-xs font-bold text-gray-700">
            {isAr ? 'كلمة المرور الحالية' : 'Current Password'}
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#d63f24] focus:ring-2 focus:ring-[#fce5d8] pe-10"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {state.fieldErrors?.currentPassword && (
            <p className="text-xs text-red-600 font-bold">{state.fieldErrors.currentPassword[0]}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1">
          <label htmlFor="newPassword" className="text-xs font-bold text-gray-700">
            {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#d63f24] focus:ring-2 focus:ring-[#fce5d8] pe-10"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Strength Meter */}
          {newPassword && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400 font-medium">{isAr ? 'قوة كلمة المرور:' : 'Strength:'}</span>
                <span className="font-bold text-gray-800">
                  {isAr ? strength.labelAr : strength.labelEn}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'rounded-full transition-all duration-300',
                      level <= strength.score ? strength.color : 'bg-gray-100'
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 pt-0.5">
                <Check className={cn('h-3 w-3', newPassword.length >= 6 ? 'text-emerald-500' : 'text-gray-300')} />
                <span>{isAr ? 'على الأقل 6 خانات' : 'At least 6 characters'}</span>
              </div>
            </div>
          )}

          {state.fieldErrors?.newPassword && (
            <p className="text-xs text-red-600 font-bold">{state.fieldErrors.newPassword[0]}</p>
          )}
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-xs font-bold text-gray-700">
            {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#d63f24] focus:ring-2 focus:ring-[#fce5d8] pe-10"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {state.fieldErrors?.confirmPassword && (
            <p className="text-xs text-red-600 font-bold">{state.fieldErrors.confirmPassword[0]}</p>
          )}
        </div>

        {/* 3D Raised Pill Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[#d63f24] hover:bg-[#c9361d] py-3.5 px-6 text-sm font-black text-white shadow-[0_4px_0_#9e2612] transition-all active:translate-y-1 active:shadow-none disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            {isPending
              ? (isAr ? 'جاري حفظ كلمة المرور الجديدة...' : 'Updating password...')
              : (isAr ? 'حفظ وتحديث كلمة المرور ←' : 'Save New Password →')}
          </span>
        </button>
      </form>

      {/* Return to Dashboard link */}
      <div className="pt-2 text-center">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-[#2563eb] hover:underline font-bold"
        >
          <BackIcon className="h-3.5 w-3.5" />
          <span>{isAr ? 'العودة إلى البوابة التعليمية' : 'Back to Portal'}</span>
        </Link>
      </div>
    </div>
  )
}
