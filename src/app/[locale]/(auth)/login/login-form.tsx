'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  locale: string
}

export function LoginForm({ locale }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || null

  const [tab, setTab] = useState<'student' | 'teacher'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(
          isAr
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : 'Invalid email or password'
        )
        return
      }

      if (!data.user) {
        setError(isAr ? 'حدث خطأ. حاول مرة أخرى' : 'Something went wrong. Try again.')
        return
      }

      // Check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = (profile as any)?.role ?? 'student'
      const dest = redirectTo ?? (role === 'teacher' ? `/${locale}/dashboard` : `/${locale}/portal`)
      router.push(dest)
      router.refresh()
    } catch {
      setError(isAr ? 'حدث خطأ غير متوقع' : 'Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
      {/* Student / Teacher Segment Switcher */}
      <div className="flex rounded-full bg-[#f3f4f6] p-1 mb-1">
        <button
          type="button"
          onClick={() => setTab('student')}
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
          onClick={() => setTab('teacher')}
          className={`flex-1 rounded-full py-1.5 text-xs font-bold transition-all ${
            tab === 'teacher'
              ? 'bg-[#d63f24] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {isAr ? '👨‍🏫 حساب المعلم' : '👨‍🏫 Teacher'}
        </button>
      </div>

      {/* Field 1: Email / Username */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-700">
          {isAr ? 'البريد الإلكتروني أو اسم المستخدم' : 'Email or username'}
        </label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            tab === 'student'
              ? isAr
                ? 'student@academy.com'
                : 'student@academy.com'
              : 'teacher@amr-academy.com'
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
        <a
          href="https://wa.me/201012006316?text=مرحباً، نسيت كلمة المرور الخاصة بحسابي"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#2563eb] hover:underline"
        >
          {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
        </a>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* 3D Raised Pill Button (Exact match to Sprout reference) */}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d63f24] py-3.5 px-6 text-sm font-black text-white shadow-[0_4px_0_#9e2612] transition-all hover:bg-[#c9361d] active:translate-y-1 active:shadow-none disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        <span>
          {loading
            ? isAr
              ? 'جاري الدخول...'
              : 'Signing in...'
            : isAr
              ? 'يلا نبدأ الرحلة ←'
              : "Let's grow →"}
        </span>
      </button>
    </form>
  )
}
