'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, HelpCircle, CheckCircle2, MessageSquare, KeyRound, X, ScanFace } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resolveLoginIdentifierAction, requestPasswordResetAction } from './actions'
import { FaceIdLoginModal } from '@/components/auth/FaceIdLoginModal'

interface Props {
  locale: string
}

export function LoginForm({ locale }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || null

  const [tab, setTab] = useState<'student' | 'teacher'>('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Face ID Modal State
  const [showFaceIdModal, setShowFaceIdModal] = useState(false)

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotInput, setForgotInput] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)
  const [forgotError, setForgotError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const rawInput = identifier.trim()
      if (!rawInput) {
        setError(isAr ? 'يرجى إدخال كود الطالب أو البريد' : 'Please enter student code or email')
        setLoading(false)
        return
      }

      // Resolve student code (e.g. S1036, s1036), phone number, or email into exact auth email
      const targetEmail = await resolveLoginIdentifierAction(rawInput)

      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      })

      if (signInError) {
        // Helpful diagnostic message
        if (tab === 'student' && !rawInput.includes('@')) {
          setError(
            isAr
              ? `كود الطالب أو كلمة المرور غير صحيحة. تأكد من إدخال كودك مثل (S1036) وكلمة المرور المسلمة لك.`
              : 'Invalid student code or password. Please check your credentials.'
          )
        } else {
          setError(
            isAr
              ? 'بيانات تسجيل الدخول غير صحيحة. يرجى التأكد والمحاولة مجدداً.'
              : 'Invalid email or password'
          )
        }
        return
      }

      if (!data.user) {
        setError(isAr ? 'حدث خطأ. حاول مرة أخرى' : 'Something went wrong. Try again.')
        return
      }

      // Check role and redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = (profile as any)?.role ?? 'student'
      const dest = redirectTo ?? (role === 'teacher' ? `/${locale}/dashboard` : `/${locale}/portal`)
      router.push(dest)
      router.refresh()
    } catch (err) {
      setError(isAr ? 'حدث خطأ غير متوقع أثناء تسجيل الدخول' : 'Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError(null)
    setForgotSuccess(null)

    const res = await requestPasswordResetAction(forgotInput.trim())
    setForgotLoading(false)

    if (res?.error) {
      setForgotError(res.error)
    } else {
      setForgotSuccess(
        isAr
          ? `تم إرسال طلب إعادة التعيين بنجاح للحساب (${res.email}). سيتواصل معك فريق الدعم أو م. عمرو فوراً.`
          : `Reset request received for (${res.email}). Support will contact you shortly.`
      )
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
        {/* Student / Teacher Segment Switcher */}
        <div className="flex rounded-full bg-[#f3f4f6] p-1 mb-1">
          <button
            type="button"
            onClick={() => {
              setTab('student')
              setError(null)
            }}
            className={`flex-1 rounded-full py-1.5 text-xs font-bold transition-all ${
              tab === 'student'
                ? 'bg-[#d63f24] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {isAr ? '🎓 حساب طالب' : '🎓 Student'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('teacher')
              setError(null)
            }}
            className={`flex-1 rounded-full py-1.5 text-xs font-bold transition-all ${
              tab === 'teacher'
                ? 'bg-[#d63f24] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {isAr ? '👨‍🏫 حساب المعلم' : '👨‍🏫 Teacher'}
          </button>
        </div>

        {/* Field 1: Student Code / Email / Username */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700">
            {tab === 'student'
              ? isAr
                ? 'كود الطالب (ID) أو البريد الإلكتروني'
                : 'Student Code or Email'
              : isAr
                ? 'البريد الإلكتروني للمعلم'
                : 'Teacher Email'}
          </label>
          <input
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={
              tab === 'student'
                ? isAr
                  ? 'مثال: S1036 أو 01012345678'
                  : 'e.g. S1036 or email'
                : 'teacher@amracademy.com'
            }
            className="w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#d63f24] focus:ring-2 focus:ring-[#fce5d8]"
            dir="ltr"
          />
        </div>

        {/* Field 2: Password */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700">
            {isAr ? 'كلمة المرور' : 'Password'}
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#d63f24] focus:ring-2 focus:ring-[#fce5d8] pe-10"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              tabIndex={-1}
              className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Row: Remember me + Forgot password */}
        <div className="flex items-center justify-between px-0.5 text-xs">
          <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300 text-[#d63f24] focus:ring-[#d63f24] accent-[#d63f24]"
            />
            <span>{isAr ? 'تذكرني' : 'Remember me'}</span>
          </label>

          {/* Open In-App Forgot Password Modal */}
          <button
            type="button"
            onClick={() => {
              setForgotInput(identifier)
              setShowForgotModal(true)
            }}
            className="font-medium text-[#2563eb] hover:underline"
          >
            {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* 3D Raised Pill Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d63f24] py-3.5 px-6 text-sm font-black text-white shadow-[0_4px_0_#9e2612] transition-all hover:bg-[#c9361d] active:translate-y-1 active:shadow-none disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            {loading
              ? isAr
                ? 'جاري التحقق والدخول...'
                : 'Signing in...'
              : isAr
                ? 'يلا نبدأ الرحلة ←'
                : "Let's grow →"}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-0.5">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[11px] font-bold text-gray-400">
            {isAr ? 'أو الدخول السريع' : 'or quick access'}
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Face ID / Biometrics Button */}
        <button
          type="button"
          onClick={() => setShowFaceIdModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 py-3 px-4 text-xs font-black text-gray-900 shadow-sm transition-all hover:bg-amber-100 hover:scale-[1.01] active:scale-[0.99]"
        >
          <ScanFace className="h-4 w-4 text-[#f6b407]" />
          <span>{isAr ? 'تسجيل الدخول عبر Face ID / بصمة الوجه' : 'Sign in with Face ID'}</span>
          <span className="rounded-full bg-[#f6b407] text-white text-[9px] px-1.5 py-0.5 font-black">
            ⚡ {isAr ? 'سريع' : 'Fast'}
          </span>
        </button>
      </form>

      {/* ── In-App Forgot Password Modal ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border-2 border-amber-100 text-start space-y-4">
            {/* Close button */}
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 end-5 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fff8e1] border-2 border-[#f6b407] flex items-center justify-center text-[#c48b05]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {isAr ? 'استعادة كلمة المرور' : 'Reset Password'}
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  {isAr ? 'خيارات استعادة الحساب المتاحة' : 'Account recovery options'}
                </p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                  {forgotSuccess}
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="rounded-xl bg-emerald-600 text-white px-5 py-2 text-xs font-black shadow-xs"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {isAr
                    ? 'اكتب كود الطالب (مثل S1036) أو رقم هاتفك أو بريدك المسجل، وسنقوم بتسجيل طلب إعادة التعيين فوراً.'
                    : 'Enter your student code (e.g. S1036) or registered phone/email to reset your password.'}
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    {isAr ? 'كود الطالب أو الهاتف أو البريد' : 'Student Code, Phone, or Email'}
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="S1036 أو 010XXXXXXXX"
                    className="w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2.5 text-xs sm:text-sm text-gray-800 outline-none focus:border-[#d63f24]"
                    dir="ltr"
                  />
                </div>

                {forgotError && (
                  <p className="text-xs text-red-600 font-bold">{forgotError}</p>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full rounded-2xl bg-[#d63f24] hover:bg-[#c9361d] text-white py-3 text-xs font-black shadow-md flex items-center justify-center gap-2"
                  >
                    {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{isAr ? 'إرسال طلب استعادة كلمة المرور' : 'Submit Reset Request'}</span>
                  </button>

                  <div className="relative text-center my-1">
                    <span className="bg-white px-2 text-[11px] text-gray-400 font-bold">
                      {isAr ? 'أو' : 'OR'}
                    </span>
                  </div>

                  {/* Direct WhatsApp Option */}
                  <a
                    href={`https://wa.me/201012006316?text=${encodeURIComponent(
                      `مرحباً م. عمرو، أود استعادة كلمة المرور لحسابي (كود/هاتف: ${forgotInput || 'بدون تحديد'}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-2xl border-2 border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-2.5 text-xs font-black flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>{isAr ? 'التواصل المباشر عبر واتساب (+201012006316)' : 'Contact via WhatsApp'}</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Face ID Biometrics Modal ── */}
      <FaceIdLoginModal
        locale={locale}
        isOpen={showFaceIdModal}
        onClose={() => setShowFaceIdModal(false)}
        initialIdentifier={identifier}
      />
    </>
  )
}
