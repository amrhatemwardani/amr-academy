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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
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

      // Get the user's role from profiles
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      {/* Student / Teacher toggle */}
      <div
        className="flex rounded-full p-1 gap-1 mb-1"
        style={{ background: '#f3f4f6' }}
      >
        {(['student', 'teacher'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 rounded-full py-1.5 text-xs font-bold transition-all"
            style={
              tab === t
                ? { background: '#e47364', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                : { background: 'transparent', color: '#6b7280' }
            }
          >
            {t === 'student'
              ? (isAr ? '🎓 طالب' : '🎓 Student')
              : (isAr ? '👨‍🏫 معلم' : '👨‍🏫 Teacher')}
          </button>
        ))}
      </div>

      {/* Email input — pill style */}
      <div className="relative">
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isAr ? 'البريد الإلكتروني' : 'Email address'}
          className="w-full rounded-full border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#e47364] focus:ring-2 focus:ring-[#fde5d9] transition-all"
          dir="ltr"
        />
      </div>

      {/* Password input — pill style */}
      <div className="relative">
        <input
          type={showPass ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isAr ? 'كلمة المرور' : 'Password'}
          className="w-full rounded-full border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#e47364] focus:ring-2 focus:ring-[#fde5d9] transition-all ltr:pr-12 rtl:pl-12"
          dir="ltr"
        />
        <button
          type="button"
          onClick={() => setShowPass(!showPass)}
          tabIndex={-1}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Remember me + Forgot password */}
      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" className="rounded accent-[#e47364]" />
          {isAr ? 'تذكرني' : 'Remember me'}
        </label>
        <span className="text-xs text-[#0050e3] hover:underline cursor-pointer">
          {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Submit button — coral pill */}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full rounded-full py-3 text-sm font-extrabold text-white mt-1 disabled:opacity-60 transition-all hover:opacity-90 active:scale-95 shadow-md"
        style={{ background: '#e47364' }}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading
          ? (isAr ? 'جاري الدخول...' : 'Signing in...')
          : (isAr ? 'ادخل الآن ←' : "Let's go →")}
      </button>
    </form>
  )
}
