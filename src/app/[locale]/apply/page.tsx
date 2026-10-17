'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Send,
  CheckCircle2,
  Phone,
  MessageSquare,
  GraduationCap,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building,
  Star,
  Check,
} from 'lucide-react'

import { submitApplicationAction } from '@/lib/applications/actions'

export default function ApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [appId, setAppId] = useState('')
  const [formData, setFormData] = useState({
    studentName: '',
    grade: 'sec3',
    subject: 'physics',
    mode: 'center',
    studentPhone: '',
    parentPhone: '',
    governorate: 'القاهرة / الجيزة',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await submitApplicationAction(formData)
    setSubmitting(false)
    if (res?.code) {
      setAppId(res.code)
      setSubmitted(true)
    } else {
      const fallbackCode = 'AMR-' + Math.floor(100000 + Math.random() * 900000)
      setAppId(fallbackCode)
      setSubmitted(true)
    }
  }

  const gradeNames: Record<string, { ar: string; en: string }> = {
    sec1: { ar: 'الصف الأول الثانوي', en: '1st Secondary (Sec 1)' },
    sec2: { ar: 'الصف الثاني الثانوي', en: '2nd Secondary (Sec 2)' },
    sec3: { ar: 'الصف الثالث الثانوي (ثانوية عامة)', en: '3rd Secondary (Thanaweya)' },
  }

  const subjectNames: Record<string, { ar: string; en: string }> = {
    physics: { ar: 'الفيزياء', en: 'Physics' },
    math: { ar: 'الرياضيات', en: 'Mathematics' },
    both: { ar: 'الفيزياء والرياضيات معاً', en: 'Both Physics & Mathematics' },
  }

  const modeNames: Record<string, { ar: string; en: string }> = {
    center: { ar: 'حضور مباشر بالسنتر', en: 'In-Person (Center)' },
    online: { ar: 'أونلاين عبر المنصة والمباشر', en: 'Online Platform & Live' },
  }

  // Pre-generate WhatsApp message
  const waText = encodeURIComponent(
    `*طلب انضمام جديد — أكاديمية م. عمرو حاتم*\n` +
    `🔖 كود الطلب: ${appId}\n` +
    `👤 اسم الطالب: ${formData.studentName}\n` +
    `📚 المرحلة: ${gradeNames[formData.grade]?.ar}\n` +
    `🔬 المادة: ${subjectNames[formData.subject]?.ar}\n` +
    `📍 نظام الدراسة: ${modeNames[formData.mode]?.ar}\n` +
    `📱 هاتف الطالب: ${formData.studentPhone}\n` +
    `📞 هاتف ولي الأمر: ${formData.parentPhone}\n` +
    `🏙️ المحافظة/المنطقة: ${formData.governorate}\n` +
    (formData.notes ? `📝 ملاحظات: ${formData.notes}\n` : '') +
    `أرجو تأكيد حجز المقعد والمواعيد المتاحة.`
  )

  const waUrl = `https://wa.me/201012006316?text=${waText}`

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ backgroundColor: '#fffdf5' }}
    >
      {/* Decorative Blobs */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#f6b407]/15 blur-2xl" />
      <div className="pointer-events-none absolute top-40 -left-20 w-80 h-80 rounded-full bg-[#bfd2ff]/30 blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#00e2ae]/15 blur-3xl" />

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-amber-100 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-[#f6b407] flex items-center justify-center text-white text-lg font-black shadow-xs">
              ⚡
            </div>
            <span className="font-black text-base text-gray-900 tracking-tight">
              {isAr ? 'أكاديمية م. عمرو حاتم' : 'Amr Hatem Academy'}
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/${locale}`}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-amber-50 transition-colors"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-full bg-[#e47364] hover:bg-[#d65e4e] text-white px-4 py-1.5 text-xs font-extrabold shadow-xs transition-transform hover:scale-105 active:scale-95"
            >
              {isAr ? 'دخول المنصة' : 'Portal Sign In'}
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="py-10 sm:py-16 relative z-10">
        <div className="container mx-auto max-w-4xl px-4">
          
          {/* Header text */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-[#fff8e1] px-4 py-1.5 text-xs font-black text-[#c48b05] mb-3 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#f6b407]" />
              <span>{isAr ? '🎓 انضم لدفعة التفوق ٢٠٢٥ / ٢٠٢٦' : 'Academic Year 2025 / 2026'}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-950">
              {isAr ? 'طلب التحاق بأكاديمية م. عمرو حاتم' : 'Academy Application & Admission'}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-xl mx-auto font-medium leading-relaxed">
              {isAr
                ? 'املأ بياناتك في دقيقة واحدة وسيتواصل معك فريق الأكاديمية فوراً لتأكيد الحجز وتحديد المواعيد والمجموعة.'
                : 'Fill in your details below to register for in-person or online Physics & Math groups.'}
            </p>
          </div>

          {submitted ? (
            /* ── SUCCESS STATE (Celebratory Card) ── */
            <div className="rounded-[32px] border-2 border-emerald-300 bg-white p-8 sm:p-12 text-center shadow-2xl space-y-6 max-w-xl mx-auto animate-fade-in">
              <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-4xl shadow-inner">
                🎉
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-950">
                  {isAr ? 'تم استلام طلبك بنجاح يا بطل!' : 'Application Submitted Successfully!'}
                </h2>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  {isAr
                    ? 'كود الحجز المرجعي الخاص بك:'
                    : 'Your registration reference code:'}
                </p>
                <div className="mt-3 inline-block rounded-2xl bg-[#fff8e1] border-2 border-[#f6b407] px-6 py-2.5 font-mono font-black text-xl text-[#c48b05] tracking-widest shadow-sm">
                  {appId}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-[#fffdf5] p-5 text-start space-y-2 text-xs sm:text-sm font-medium">
                <p className="font-extrabold text-gray-900 border-b border-amber-100 pb-2">
                  {isAr ? 'بيانات التسجيل:' : 'Submitted Details:'}
                </p>
                <p><span className="text-gray-500">{isAr ? 'اسم الطالب:' : 'Student:'}</span> <strong className="text-gray-900">{formData.studentName}</strong></p>
                <p><span className="text-gray-500">{isAr ? 'المرحلة:' : 'Grade:'}</span> <strong className="text-gray-900">{gradeNames[formData.grade]?.[isAr ? 'ar' : 'en']}</strong></p>
                <p><span className="text-gray-500">{isAr ? 'المادة:' : 'Subject:'}</span> <strong className="text-gray-900">{subjectNames[formData.subject]?.[isAr ? 'ar' : 'en']}</strong></p>
                <p><span className="text-gray-500">{isAr ? 'نظام الدراسة:' : 'Mode:'}</span> <strong className="text-gray-900">{modeNames[formData.mode]?.[isAr ? 'ar' : 'en']}</strong></p>
              </div>

              {/* Direct WhatsApp Action Button */}
              <div className="space-y-3 pt-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#25d366] hover:bg-[#20ba59] text-white px-6 py-4 text-base font-black shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105 active:scale-95"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>{isAr ? 'إرسال الطلب عبر واتساب لتأكيد الحجز فوراً 💬' : 'Confirm via WhatsApp Now'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-gray-500 hover:text-gray-900 underline pt-2 block mx-auto font-bold"
                >
                  {isAr ? 'تسجيل طلب طالب آخر' : 'Submit another application'}
                </button>
              </div>
            </div>
          ) : (
            /* ── APPLICATION FORM ── */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Column */}
              <div className="lg:col-span-2">
                <form
                  onSubmit={handleSubmit}
                  className="rounded-[32px] border-2 border-amber-100 bg-white p-6 sm:p-8 shadow-xl space-y-5"
                >
                  {/* Student Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                      {isAr ? 'اسم الطالب رباعي' : 'Student Full Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'مثال: محمد أحمد إبراهيم علي' : 'e.g. Mohamed Ahmed Ibrahim'}
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-medium"
                    />
                  </div>

                  {/* Grade and Subject Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        {isAr ? 'المرحلة الدراسية' : 'Grade / Stage'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-semibold"
                      >
                        <option value="sec3">{isAr ? 'الصف الثالث الثانوي (ثانوية عامة)' : 'Sec 3 (Thanaweya)'}</option>
                        <option value="sec2">{isAr ? 'الصف الثاني الثانوي' : 'Sec 2'}</option>
                        <option value="sec1">{isAr ? 'الصف الأول الثانوي' : 'Sec 1'}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        {isAr ? 'المادة المطلوبة' : 'Subject'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-semibold"
                      >
                        <option value="physics">{isAr ? 'الفيزياء' : 'Physics'}</option>
                        <option value="math">{isAr ? 'الرياضيات (بحتة وتطبيقية)' : 'Mathematics'}</option>
                        <option value="both">{isAr ? 'الفيزياء والرياضيات معاً' : 'Both Physics & Math'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Mode of Study */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                      {isAr ? 'نظام الدراسة المفضل' : 'Study Mode'} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mode: 'center' })}
                        className={`p-3.5 rounded-2xl border-2 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                          formData.mode === 'center'
                            ? 'border-[#0050e3] bg-[#e8f4ff] text-[#0050e3] shadow-xs'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Building className="h-4 w-4" />
                        <span>{isAr ? 'حضور مباشر بالسنتر' : 'In-Person (Center)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mode: 'online' })}
                        className={`p-3.5 rounded-2xl border-2 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                          formData.mode === 'online'
                            ? 'border-[#f6b407] bg-[#fff8e1] text-[#c48b05] shadow-xs'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>{isAr ? 'أونلاين عبر المنصة' : 'Online Platform'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Phones Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        {isAr ? 'رقم هاتف الطالب (واتساب)' : 'Student Phone (WhatsApp)'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        inputMode="tel"
                        dir="ltr"
                        placeholder="010XXXXXXXX"
                        value={formData.studentPhone}
                        onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                        className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-mono font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        {isAr ? 'رقم هاتف ولي الأمر' : 'Parent Phone'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        inputMode="tel"
                        dir="ltr"
                        placeholder="010XXXXXXXX"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-mono font-medium"
                      />
                    </div>
                  </div>

                  {/* Governorate / Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                      {isAr ? 'المدينة / المنطقة السكنية' : 'City / Area'}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: مدينة نصر، المعادي، الجيزة، أو أونلاين من أي محافظة' : 'e.g. Cairo, Giza, Alexandria or Online'}
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-medium"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                      {isAr ? 'ملاحظات أو مواعيد تفضلها' : 'Additional Notes / Preferences'}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={isAr ? 'اكتب أي استفسار أو موعد يناسب جدولك الدراسي...' : 'Any preferences or inquiries...'}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="flex w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] p-4 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-medium resize-none"
                    />
                  </div>

                  {/* 3D Raised Pill Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-3 flex items-center justify-center gap-2 rounded-2xl bg-[#d63f24] hover:bg-[#c9361d] py-4 px-6 text-base font-black text-white shadow-[0_4px_0_#9e2612] transition-all active:translate-y-1 active:shadow-none disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {submitting
                        ? isAr ? 'جاري إرسال الطلب...' : 'Submitting...'
                        : isAr ? 'إرسال طلب الانضمام الآن ←' : 'Submit Admission Request →'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Sidebar Info Column */}
              <div className="space-y-5">
                {/* Contact Card */}
                <div className="rounded-[28px] border-2 border-emerald-200 bg-white p-6 shadow-md space-y-4">
                  <h3 className="font-black text-gray-950 text-base flex items-center gap-2">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    <span>{isAr ? 'تواصل معنا مباشرة' : 'Direct Contact'}</span>
                  </h3>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <a
                      href="https://wa.me/201012006316"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-emerald-400 bg-emerald-50 text-emerald-800 font-extrabold hover:bg-emerald-100 transition-colors shadow-xs"
                    >
                      <MessageSquare className="h-5 w-5 shrink-0 text-emerald-600" />
                      <span>WhatsApp: +20 101 200 6316</span>
                    </a>

                    <a
                      href="tel:+201012006316"
                      className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 font-mono font-bold hover:bg-gray-100 transition-colors"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-[#0050e3]" />
                      <span dir="ltr">+20 101 200 6316</span>
                    </a>
                  </div>
                </div>

                {/* What Happens Next Card */}
                <div className="rounded-[28px] border-2 border-amber-200 bg-[#fff9e6] p-6 space-y-4 text-xs sm:text-sm">
                  <h4 className="font-black text-gray-950 text-sm flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#f6b407]" />
                    <span>{isAr ? 'ماذا يحدث بعد إرسال الطلب؟' : 'What Happens Next?'}</span>
                  </h4>
                  <ul className="space-y-3 text-gray-700 leading-relaxed font-semibold">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#f6b407] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        ١
                      </span>
                      <span>{isAr ? 'مراجعة بياناتك والتواصل معك هاتفياً وعبر واتساب في خلال ساعات.' : 'Application reviewed & parent contacted.'}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0050e3] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        ٢
                      </span>
                      <span>{isAr ? 'تأكيد الحجز في السنتر أو تفعيل الاشتراك الأونلاين.' : 'Placement test or group scheduling.'}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#e51e6b] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        ٣
                      </span>
                      <span>{isAr ? 'استلام كود الحساب للدخول على بنك الأسئلة والامتحانات فوراً.' : 'Receive Smart Student ID Card & portal account.'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating WhatsApp Action Button */}
      <aside aria-label="WhatsApp Contact" className="fixed bottom-6 end-6 z-40">
        <a
          href="https://wa.me/201012006316?text=مرحبا%20م.%20عمرو%20حاتم%20أود%20الاستفسار%20عن%20طلب%20الالتحاق"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-full bg-[#25d366] hover:bg-[#20ba59] text-white p-3.5 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="hidden sm:inline-block text-xs font-black pe-1">
            {isAr ? 'واتساب الأكاديمية' : 'WhatsApp Us'}
          </span>
        </a>
      </aside>
    </div>
  )
}
