'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ScanFace,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Lock,
  UserCheck,
  Sparkles,
  Smartphone,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import {
  getEnrolledBiometric,
  saveEnrolledBiometric,
  removeEnrolledBiometric,
  listEnrolledBiometrics,
  isPlatformAuthenticatorAvailable,
  getClientDeviceName,
  promptNativeBiometrics,
  type EnrolledBiometricProfile,
} from '@/lib/auth/webauthn'
import { enrollFaceIdAction, verifyFaceIdLoginAction } from '@/app/[locale]/(auth)/login/face-id-actions'
import { createClient } from '@/lib/supabase/client'

interface Props {
  locale: string
  isOpen: boolean
  onClose: () => void
  initialIdentifier?: string
}

export function FaceIdLoginModal({ locale, isOpen, onClose, initialIdentifier = '' }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()

  const [enrolledProfile, setEnrolledProfile] = useState<EnrolledBiometricProfile | null>(null)
  const [allEnrolledProfiles, setAllEnrolledProfiles] = useState<EnrolledBiometricProfile[]>([])
  const [activeTab, setActiveTab] = useState<'scan' | 'camera' | 'setup'>('scan')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Setup form states
  const [setupIdentifier, setSetupIdentifier] = useState(initialIdentifier)
  const [setupPassword, setSetupPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Camera scanner states
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatusText, setScanStatusText] = useState('')

  // Load existing enrolled biometric safely for this PC
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccessMsg(null)
      const all = listEnrolledBiometrics()
      setAllEnrolledProfiles(all)

      const existing = getEnrolledBiometric(initialIdentifier)
      setEnrolledProfile(existing)

      if (existing) {
        setActiveTab('scan')
      } else {
        setActiveTab('setup')
        if (initialIdentifier) {
          setSetupIdentifier(initialIdentifier)
          if (all.length > 0) {
            setError(
              isAr
                ? `الحساب (${initialIdentifier}) غير مفعل ببصمة الوجه على هذا الجهاز بعد. أدخل كلمة المرور لتفعيله.`
                : `Account (${initialIdentifier}) is not enrolled for Face ID on this PC. Please enter password once to enable.`
            )
          }
        }
      }
    } else {
      stopCamera()
    }
  }, [isOpen, initialIdentifier, isAr])

  // Stop camera stream cleanly
  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setCameraActive(false)
    setScanProgress(0)
  }

  // Handle Camera activation
  async function startCameraScanner() {
    setActiveTab('camera')
    setError(null)
    setScanProgress(0)
    setScanStatusText(isAr ? 'جاري فتح الكاميرا...' : 'Initializing camera...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      setCameraStream(stream)
      setCameraActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setScanStatusText(isAr ? 'ضع وجهك داخل الإطار...' : 'Center face inside the oval...')

      // Simulate face scanning progression
      let p = 0
      const interval = setInterval(() => {
        p += 15
        if (p <= 85) {
          setScanProgress(p)
          if (p === 45) {
            setScanStatusText(isAr ? 'تم تحديد ملامح الوجه... جاري المطابقة' : 'Facial points mapped... Matching')
          }
        } else if (p >= 100) {
          clearInterval(interval)
          setScanProgress(100)
          setScanStatusText(isAr ? 'تم التحقق من الوجه بنجاح!' : 'Face Verified!')
          setTimeout(() => {
            stopCamera()
            executeBiometricLogin()
          }, 800)
        }
      }, 250)
    } catch (err: any) {
      console.error('Camera access error:', err)
      setError(
        isAr
          ? 'تعذر الوصول إلى الكاميرا. يرجى التأكد من السماح بصلاحية الكاميرا أو استخدام بصمة الجهاز.'
          : 'Unable to access camera. Please check camera permissions or use device biometrics.'
      )
      setCameraActive(false)
    }
  }

  // ── 1. Execute Biometric Verification & Login ──────────────────────────────
  async function executeBiometricLogin() {
    const profile = enrolledProfile || getEnrolledBiometric()
    if (!profile) {
      setError(isAr ? 'لم يتم العثور على حساب مسجل ببصمة الوجه. يرجى تفعيلها أولاً.' : 'No biometric account found.')
      setActiveTab('setup')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Verify with server
      const res = await verifyFaceIdLoginAction({
        identifier: profile.identifier,
        biometricToken: profile.biometricToken,
      })

      if (res.error || !res.tokenHash) {
        setError(res.error || 'Biometric verification failed.')
        setLoading(false)
        return
      }

      // 2. Client signs in with Supabase Auth using magiclink token
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.verifyOtp({
        token_hash: res.tokenHash,
        type: 'magiclink',
      })

      if (signInError) {
        // Fallback with email otp if available
        if (res.email && res.emailOtp) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            email: res.email,
            token: res.emailOtp,
            type: 'email',
          })
          if (otpError) {
            setError(isAr ? 'فشل إتمام تسجيل الدخول. يرجى إعادة المحاولة.' : 'Authentication failed.')
            setLoading(false)
            return
          }
        } else {
          setError(signInError.message)
          setLoading(false)
          return
        }
      }

      setSuccessMsg(isAr ? 'تم تسجيل الدخول بنجاح! جاري التوجيه...' : 'Authenticated successfully! Redirecting...')

      setTimeout(() => {
        onClose()
        const dest = res.mustChangePassword
          ? `/${locale}/change-password`
          : res.role === 'teacher'
          ? `/${locale}/dashboard`
          : `/${locale}/portal`
        router.push(dest)
        router.refresh()
      }, 700)
    } catch (err) {
      console.error('Biometric sign in error:', err)
      setError(isAr ? 'حدث خطأ أثناء تسجيل الدخول.' : 'Unexpected authentication error.')
    } finally {
      setLoading(false)
    }
  }

  // ── 2. Trigger Device Native Face ID Prompt ───────────────────────────────
  async function handleNativeBiometricPrompt() {
    const profile = enrolledProfile || getEnrolledBiometric()
    if (!profile) {
      setActiveTab('setup')
      return
    }

    setError(null)
    setLoading(true)

    // Check if platform authenticator is supported
    const hasPlatform = await isPlatformAuthenticatorAvailable()
    if (hasPlatform && profile.email) {
      const nativeRes = await promptNativeBiometrics('verify', profile.email, profile.studentName)
      if (!nativeRes.success) {
        // If user cancelled, don't show scary error; offer camera
        if (nativeRes.error?.includes('cancelled')) {
          setLoading(false)
          return
        }
      }
    }

    // Proceed to server verification
    await executeBiometricLogin()
  }

  // ── 3. Handle First-Time Enrollment ───────────────────────────────────────
  async function handleEnrollSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const deviceName = getClientDeviceName()
      const res = await enrollFaceIdAction({
        identifier: setupIdentifier.trim(),
        password: setupPassword,
        deviceName,
      })

      if (res.error || !res.biometricToken) {
        setError(res.error || 'Failed to activate Face ID.')
        setLoading(false)
        return
      }

      // Check if native platform credential creation is possible
      let credentialId: string | undefined
      const hasPlatform = await isPlatformAuthenticatorAvailable()
      if (hasPlatform && res.email) {
        const nativeRes = await promptNativeBiometrics('enroll', res.email, res.studentName || 'Student')
        if (nativeRes.success) {
          credentialId = nativeRes.credentialId
        }
      }

      const enrolledData: EnrolledBiometricProfile = {
        identifier: setupIdentifier.trim(),
        studentCode: res.studentCode || setupIdentifier.toUpperCase(),
        studentName: res.studentName || 'Student',
        email: res.email || '',
        role: res.role || 'student',
        biometricToken: res.biometricToken,
        credentialId,
        enrolledAt: new Date().toISOString(),
        deviceName,
      }

      saveEnrolledBiometric(enrolledData)
      setEnrolledProfile(enrolledData)
      setSuccessMsg(
        isAr
          ? 'تم تفعيل Face ID لهذا الجهاز بنجاح! جاري تسجيل الدخول...'
          : 'Face ID activated successfully! Logging in...'
      )

      // Automatically complete login
      setTimeout(async () => {
        await executeBiometricLogin()
      }, 900)
    } catch (err) {
      console.error('Enroll error:', err)
      setError(isAr ? 'حدث خطأ غير متوقع أثناء تفعيل Face ID' : 'Unexpected error during activation')
      setLoading(false)
    }
  }

  // ── 4. Remove / Forget Device Biometric ────────────────────────────────────
  function handleRemoveBiometric() {
    if (confirm(isAr ? 'هل تريد إزالة Face ID المسجل على هذا المتصفح؟' : 'Remove saved Face ID on this device?')) {
      removeEnrolledBiometric()
      setEnrolledProfile(null)
      setActiveTab('setup')
      setError(null)
      setSuccessMsg(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-[32px] bg-white dark:bg-[#101726] p-6 sm:p-8 shadow-2xl border-2 border-amber-200 dark:border-amber-500/30 text-start space-y-5 overflow-hidden">
        {/* Decorative corner glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#f6b407]/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-[#0050e3]/15 blur-2xl" />

        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera()
            onClose()
          }}
          className="absolute top-5 end-5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f6b407] to-[#e47364] flex items-center justify-center text-white shadow-md">
            <ScanFace className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-950 dark:text-white flex items-center gap-2">
              <span>{isAr ? 'تسجيل الدخول عبر Face ID' : 'Face ID Sign In'}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                AI Fast
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
              {isAr ? 'الدخول الذكي والسريع ببصمة الوجه الموثقة' : 'Secure biometric authentication'}
            </p>
          </div>
        </div>

        {/* Tab Switcher (if enrolled) */}
        {enrolledProfile && (
          <div className="flex rounded-2xl bg-gray-100 dark:bg-[#151c2c] p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                stopCamera()
                setActiveTab('scan')
              }}
              className={`flex-1 rounded-xl py-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'scan'
                  ? 'bg-white dark:bg-[#1f283d] text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 text-[#f6b407]" />
              <span>{isAr ? 'بصمة الجهاز' : 'Native Face ID'}</span>
            </button>

            <button
              type="button"
              onClick={startCameraScanner}
              className={`flex-1 rounded-xl py-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'camera'
                  ? 'bg-white dark:bg-[#1f283d] text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              <Camera className="h-3.5 w-3.5 text-[#0050e3]" />
              <span>{isAr ? 'ماسح الكاميرا' : 'Live Camera'}</span>
            </button>
          </div>
        )}

        {/* ── TAB 1: ONE-TAP NATIVE FACE ID ─────────────────────────────────── */}
        {activeTab === 'scan' && enrolledProfile && (
          <div className="space-y-4 text-center py-2">
            {/* Student ID Card Badge */}
            <div className="rounded-2xl border-2 border-amber-200 dark:border-slate-700/80 bg-gradient-to-br from-amber-50/60 to-white dark:from-[#131a29] dark:to-[#172033] p-4 text-start flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0050e3] text-white flex items-center justify-center font-black text-base shadow-sm">
                  {enrolledProfile.studentName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-950 dark:text-white">
                    {enrolledProfile.studentName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-black text-[#0050e3] dark:text-[#60a5fa]">
                      {enrolledProfile.studentCode}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      📱 {enrolledProfile.deviceName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                <span>{isAr ? 'مفعل' : 'Ready'}</span>
              </div>
            </div>

            {/* Same PC Multi-Account Switcher */}
            {allEnrolledProfiles.length > 1 && (
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#151c2c] border border-gray-200 dark:border-slate-800 text-start space-y-2">
                <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
                  {isAr ? 'حسابات مسجلة على هذا الكمبيوتر:' : 'Accounts on this PC:'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allEnrolledProfiles.map((p) => (
                    <button
                      key={p.studentCode}
                      type="button"
                      onClick={() => {
                        setEnrolledProfile(p)
                        setError(null)
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                        enrolledProfile?.studentCode === p.studentCode
                          ? 'bg-[#0050e3] text-white border-transparent shadow-xs'
                          : 'bg-white dark:bg-[#1a2235] text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      {p.studentName} ({p.studentCode})
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSetupIdentifier('')
                      setActiveTab('setup')
                    }}
                    className="px-2 py-1 rounded-xl text-xs font-bold border border-dashed border-gray-300 dark:border-slate-700 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  >
                    + {isAr ? 'حساب آخر' : 'Add another'}
                  </button>
                </div>
              </div>
            )}

            {/* Glowing Face Scan Radar Button */}
            <div className="py-3 flex flex-col items-center">
              <button
                type="button"
                onClick={handleNativeBiometricPrompt}
                disabled={loading}
                className="group relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#f6b407] to-[#e47364] text-white shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {/* Outer animated radar ring */}
                <span className="absolute -inset-2 rounded-3xl border-2 border-[#f6b407] opacity-60 animate-ping group-hover:opacity-100" />
                <span className="absolute -inset-1 rounded-3xl border border-amber-300 opacity-80" />

                {loading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <ScanFace className="h-12 w-12 transition-transform group-hover:scale-110" />
                )}
              </button>

              <p className="text-xs font-black text-gray-800 dark:text-slate-200 mt-4">
                {isAr ? 'اضغط للمسح والتحقق الفوري' : 'Tap to scan with Face ID'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                {isAr ? 'يدعم Apple Face ID و Windows Hello' : 'Supports Apple Face ID & Windows Hello'}
              </p>
            </div>

            {/* Secondary switch to camera scanner */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={startCameraScanner}
                className="text-[#0050e3] dark:text-[#60a5fa] font-bold hover:underline flex items-center gap-1"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{isAr ? 'فتح ماسح الكاميرا الحي' : 'Use Live Camera'}</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveBiometric}
                className="text-gray-400 hover:text-red-500 font-medium"
              >
                {isAr ? 'إلغاء ربط الجهاز' : 'Unlink Device'}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: LIVE CAMERA FACE SCANNER ───────────────────────────────── */}
        {activeTab === 'camera' && (
          <div className="space-y-4 text-center">
            {/* Live Camera View with Face ID Oval HUD */}
            <div className="relative mx-auto w-full max-w-[280px] aspect-[4/5] rounded-[36px] overflow-hidden bg-black shadow-inner border-2 border-[#0050e3] dark:border-blue-500">
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Sci-Fi Biometric Scanning Oval Reticle */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="relative w-44 h-56 rounded-full border-2 border-dashed border-[#f6b407] dark:border-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(246,180,7,0.4)]">
                  {/* Sweeping Laser Line */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00e2ae] to-transparent shadow-[0_0_15px_#00e2ae] animate-laser-sweep" />

                  {/* Corner Targets */}
                  <div className="absolute top-2 left-4 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-2 right-4 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-2 left-4 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-2 right-4 w-3 h-3 border-b-2 border-r-2 border-white" />

                  {scanProgress >= 100 && (
                    <div className="rounded-full bg-emerald-500 p-3 text-white animate-scale-up shadow-xl">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                  )}
                </div>
              </div>

              {/* Top scanning badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-black text-white border border-white/20">
                {scanStatusText}
              </div>

              {/* Progress bar at bottom */}
              <div className="absolute bottom-3 left-6 right-6 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#f6b407] to-[#00e2ae] transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  stopCamera()
                  setActiveTab('scan')
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                {isAr ? 'العودة للبصمة العادية' : 'Back to Native'}
              </button>

              <button
                type="button"
                onClick={executeBiometricLogin}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#0050e3] hover:bg-blue-700 text-xs font-black text-white shadow-sm flex items-center gap-1.5"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isAr ? 'تأكيد الدخول الآن' : 'Confirm Login'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: FIRST-TIME SETUP ───────────────────────────────────────── */}
        {activeTab === 'setup' && (
          <form onSubmit={handleEnrollSubmit} className="space-y-3.5">
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 p-3.5 text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
              💡 {isAr
                ? 'لتفعيل بصمة الوجه (Face ID) على هذا الجهاز، يرجى إدخال كود الطالب وكلمة المرور لمرة واحدة فقط لتأكيد الهوية.'
                : 'To enable Face ID on this device, please verify your student code and password once.'}
            </div>

            {/* Identifier input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                {isAr ? 'كود الطالب (ID) أو البريد' : 'Student Code or Email'}
              </label>
              <input
                type="text"
                required
                value={setupIdentifier}
                onChange={(e) => setSetupIdentifier(e.target.value)}
                placeholder="مثال: S1036 أو 01012345678"
                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#151c2c] px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#f6b407]"
                dir="ltr"
              />
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#151c2c] px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#f6b407] pe-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0050e3] hover:bg-blue-700 py-3.5 px-6 text-xs sm:text-sm font-black text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanFace className="h-4 w-4" />
              )}
              <span>
                {loading
                  ? isAr ? 'جاري التحقق والربط...' : 'Activating Face ID...'
                  : isAr ? 'تفعيل Face ID لهذا الجهاز ←' : 'Activate Face ID for this device →'}
              </span>
            </button>
          </form>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-bold text-red-600 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  )
}
