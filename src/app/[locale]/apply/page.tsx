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
} from 'lucide-react'

export default function ApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const [submitted, setSubmitted] = useState(false)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const randomCode = 'AMR-' + Math.floor(100000 + Math.random() * 900000)
    setAppId(randomCode)
    setSubmitted(true)
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
    <div className={`min-h-screen bg-background ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Eng. Amr Hatem Academy"
              width={180}
              height={50}
              priority
              className="h-9 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}`}
              className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-xl border border-border px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              {isAr ? 'دخول المنصة' : 'Portal Sign In'}
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="py-10 sm:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{isAr ? 'العام الدراسي ٢٠٢٥ / ٢٠٢٦' : 'Academic Year 2025 / 2026'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isAr ? 'طلب التحاق بأكاديمية م. عمرو حاتم' : 'Academy Application & Admission'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {isAr
                ? 'املأ الاستمارة وسنتواصل معك لتأكيد الحجز وتحديد المواعيد والمجموعة المناسبة.'
                : 'Fill in your details below to register for in-person or online Physics & Math groups.'}
            </p>
          </div>

          {submitted ? (
            /* ── SUCCESS STATE ── */
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center shadow-xl space-y-6 max-w-xl mx-auto animate-fade-in">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-foreground">
                  {isAr ? 'تم تسجيل طلبك بنجاح!' : 'Application Submitted Successfully!'}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {isAr
                    ? 'كود طلبك التعريفي هو:'
                    : 'Your registration reference code:'}
                </p>
                <div className="mt-2 inline-block rounded-xl bg-card border border-border px-5 py-2 font-mono font-black text-lg text-primary tracking-wider shadow-sm">
                  {appId}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 text-start space-y-2 text-xs sm:text-sm">
                <p className="font-bold text-foreground border-b border-border pb-2">
                  {isAr ? 'بيانات التسجيل المسجلة:' : 'Submitted Details:'}
                </p>
                <p><span className="text-muted-foreground">{isAr ? 'اسم الطالب:' : 'Student:'}</span> <strong className="text-foreground">{formData.studentName}</strong></p>
                <p><span className="text-muted-foreground">{isAr ? 'المرحلة:' : 'Grade:'}</span> <strong className="text-foreground">{gradeNames[formData.grade]?.[isAr ? 'ar' : 'en']}</strong></p>
                <p><span className="text-muted-foreground">{isAr ? 'المادة:' : 'Subject:'}</span> <strong className="text-foreground">{subjectNames[formData.subject]?.[isAr ? 'ar' : 'en']}</strong></p>
                <p><span className="text-muted-foreground">{isAr ? 'النظام:' : 'Mode:'}</span> <strong className="text-foreground">{modeNames[formData.mode]?.[isAr ? 'ar' : 'en']}</strong></p>
              </div>

              {/* Direct WhatsApp Action Button */}
              <div className="space-y-3">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-emerald-600/30 transition-transform hover:scale-[1.02]"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>{isAr ? 'إرسال الطلب فوراً عبر واتساب لتأكيد الحجز' : 'Confirm via WhatsApp Now'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-muted-foreground hover:text-foreground underline pt-2"
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
                  className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4"
                >
                  {/* Student Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-foreground">
                      {isAr ? 'اسم الطالب رباعي' : 'Student Full Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'مثال: محمد أحمد إبراهيم علي' : 'e.g. Mohamed Ahmed Ibrahim'}
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Grade and Subject Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-foreground">
                        {isAr ? 'المرحلة الدراسية' : 'Grade / Stage'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="sec3">{isAr ? 'الصف الثالث الثانوي (ثانوية عامة)' : 'Sec 3 (Thanaweya)'}</option>
                        <option value="sec2">{isAr ? 'الصف الثاني الثانوي' : 'Sec 2'}</option>
                        <option value="sec1">{isAr ? 'الصف الأول الثانوي' : 'Sec 1'}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-foreground">
                        {isAr ? 'المادة المطلوبة' : 'Subject'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="physics">{isAr ? 'الفيزياء' : 'Physics'}</option>
                        <option value="math">{isAr ? 'الرياضيات (بحتة وتطبيقية)' : 'Mathematics'}</option>
                        <option value="both">{isAr ? 'الفيزياء والرياضيات معاً' : 'Both Physics & Math'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Mode of Study */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-foreground">
                      {isAr ? 'نظام الدراسة المفضل' : 'Study Mode'} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mode: 'center' })}
                        className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                          formData.mode === 'center'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        <Building className="h-4 w-4" />
                        <span>{isAr ? 'حضور بالسنتر' : 'In-Person (Center)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mode: 'online' })}
                        className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                          formData.mode === 'online'
                            ? 'border-[#F2B134] bg-[#F2B134]/10 text-[#0F2A4A] dark:text-[#F2B134]'
                            : 'border-border bg-background text-muted-foreground'
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
                      <label className="text-xs sm:text-sm font-semibold text-foreground">
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
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-foreground">
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
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      />
                    </div>
                  </div>

                  {/* Governorate / Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-foreground">
                      {isAr ? 'المدينة / المنطقة' : 'City / Area'}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: مدينة نصر، المعادي، الجيزة، أو أونلاين من أي محافظة' : 'e.g. Cairo, Giza, Alexandria or Online'}
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-foreground">
                      {isAr ? 'ملاحظات أو أسئلة إضافية' : 'Additional Notes / Questions'}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={isAr ? 'اكتب أي ملاحظة أو موعد تفضله...' : 'Any preferences or inquiries...'}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="flex w-full rounded-xl border border-input bg-background p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white py-2.5 px-5 font-semibold text-sm shadow-sm transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isAr ? 'إرسال طلب الانضمام الآن' : 'Submit Admission Request'}</span>
                  </button>
                </form>
              </div>

              {/* Sidebar Info Column */}
              <div className="space-y-4">
                {/* Contact Card */}
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{isAr ? 'التواصل المباشر' : 'Direct Contact'}</span>
                  </h3>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <a
                      href="https://wa.me/201012006316"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span>WhatsApp: +20 101 200 6316</span>
                    </a>

                    <a
                      href="tel:+201012006316"
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/40 text-foreground font-mono hover:bg-muted transition-colors"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-primary" />
                      <span dir="ltr">+20 101 200 6316</span>
                    </a>
                  </div>
                </div>

                {/* Benefits Card */}
                <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-3 text-xs sm:text-sm">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'ماذا بعد إرسال الطلب؟' : 'What Happens Next?'}</span>
                  </h4>
                  <ul className="space-y-2 text-muted-foreground leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">١.</span>
                      <span>{isAr ? 'يتم مراجعة الطلب والتواصل مع الطالب وولي الأمر هاتفياً وعبر واتساب.' : 'Application reviewed & parent contacted.'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">٢.</span>
                      <span>{isAr ? 'تحديد موعد المقابلة أو اختبار تحديد المستوى المجاني.' : 'Placement test or group scheduling.'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">٣.</span>
                      <span>{isAr ? 'تسليم كارنيه الأكاديمية الذكي وحساب تسجيل الدخول للمنصة.' : 'Receive Smart Student ID Card & portal account.'}</span>
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
          className="group flex items-center gap-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="hidden sm:inline-block text-xs font-bold pe-1">
            {isAr ? 'استفسار عبر واتساب' : 'WhatsApp Us'}
          </span>
        </a>
      </aside>
    </div>
  )
}
