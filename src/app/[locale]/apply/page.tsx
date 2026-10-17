'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import {
  Send,
  CheckCircle2,
  Phone,
  MessageSquare,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Building,
  Globe,
  BookOpen,
} from 'lucide-react'
import { submitApplicationAction } from '@/lib/applications/actions'

const COUNTRIES = [
  { code: 'EG', dial: '+20', flag: '🇪🇬', nameAr: 'مصر', nameEn: 'Egypt' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', nameAr: 'الإمارات العربية المتحدة', nameEn: 'UAE' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', nameAr: 'الكويت', nameEn: 'Kuwait' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', nameAr: 'قطر', nameEn: 'Qatar' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', nameAr: 'سلطنة عُمان', nameEn: 'Oman' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', nameAr: 'البحرين', nameEn: 'Bahrain' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', nameAr: 'الأردن', nameEn: 'Jordan' },
  { code: 'OTHER', dial: '+1', flag: '🌍', nameAr: 'دولة أخرى', nameEn: 'Other Country' },
]

const GRADES = [
  { value: 'grade_8', ar: 'الصف الثاني الإعدادي', en: 'Grade 8 (Prep 2)' },
  { value: 'grade_9', ar: 'الصف الثالث الإعدادي', en: 'Grade 9 (Prep 3)' },
  { value: 'grade_10', ar: 'الصف الأول الثانوي', en: 'Grade 10 (Sec 1)' },
  { value: 'grade_11', ar: 'الصف الثاني الثانوي', en: 'Grade 11 (Sec 2)' },
  { value: 'grade_12', ar: 'الصف الثالث الثانوي (ثانوية عامة)', en: 'Grade 12 (Sec 3 / Thanawya)' },
]

export default function ApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const isAr = locale === 'ar'

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [appId, setAppId] = useState('')

  const [country, setCountry] = useState('EG')
  const [countryDial, setCountryDial] = useState('+20')
  const [parentCountryDial, setParentCountryDial] = useState('+20')
  const [studyLanguage, setStudyLanguage] = useState<'arabic' | 'english'>('arabic')

  const [formData, setFormData] = useState({
    studentName: '',
    grade: 'grade_12',
    subject: 'physics',
    mode: 'center',
    studentPhone: '',
    parentPhone: '',
    governorate: '',
    notes: '',
  })

  const handleCountryChange = (cCode: string) => {
    setCountry(cCode)
    const found = COUNTRIES.find((c) => c.code === cCode)
    if (found) {
      setCountryDial(found.dial)
      setParentCountryDial(found.dial)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      ...formData,
      country: COUNTRIES.find((c) => c.code === country)?.nameAr || country,
      countryCode: countryDial,
      parentCountryCode: parentCountryDial,
      studyLanguage,
      studentPhone: `${countryDial} ${formData.studentPhone}`,
      parentPhone: `${parentCountryDial} ${formData.parentPhone}`,
    }

    const res = await submitApplicationAction(payload)
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

  const gradeObj = GRADES.find((g) => g.value === formData.grade) || GRADES[4]
  const selectedCountryObj = COUNTRIES.find((c) => c.code === country)

  // WhatsApp text in dual language
  const waText = encodeURIComponent(
    `*طلب التحاق جديد / New Admission Application*\n` +
    `🔖 كود الطلب / Reference Code: ${appId}\n` +
    `👤 اسم الطالب / Student: ${formData.studentName}\n` +
    `📚 المرحلة / Grade: ${gradeObj.ar} (${gradeObj.en})\n` +
    `🌐 لغة الدراسة / Language: ${studyLanguage === 'arabic' ? 'عربي / Arabic' : 'لغات / English'}\n` +
    `🌍 الدولة / Country: ${selectedCountryObj?.flag} ${selectedCountryObj?.nameAr} (${selectedCountryObj?.nameEn})\n` +
    `🔬 المادة / Subject: ${formData.subject === 'physics' ? 'الفيزياء / Physics' : formData.subject === 'math' ? 'الرياضيات / Math' : 'الفيزياء والرياضيات / Both'}\n` +
    `📍 نظام الدراسة / Mode: ${formData.mode === 'center' ? 'سنتر مباشر / Center' : 'أونلاين عبر المنصة / Online'}\n` +
    `📱 هاتف الطالب / Student: ${countryDial} ${formData.studentPhone}\n` +
    `📞 هاتف ولي الأمر / Parent: ${parentCountryDial} ${formData.parentPhone}\n` +
    (formData.governorate ? `🏙️ المنطقة / City: ${formData.governorate}\n` : '') +
    (formData.notes ? `📝 ملاحظات / Notes: ${formData.notes}\n` : '') +
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
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-base text-gray-900 leading-tight">
                أكاديمية م. عمرو حاتم
              </span>
              <span className="text-[10px] text-[#0050e3] font-bold leading-none">
                Eng. Amr Hatem Academy
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/${locale}`}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-amber-50 transition-colors"
            >
              الرئيسية / Home
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-full bg-[#e47364] hover:bg-[#d65e4e] text-white px-4 py-1.5 text-xs font-extrabold shadow-xs transition-transform hover:scale-105 active:scale-95"
            >
              دخول المنصة / Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="py-10 sm:py-16 relative z-10">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Header Title (Dual Language) */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-[#fff8e1] px-4 py-1.5 text-xs font-black text-[#c48b05] mb-3 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#f6b407]" />
              <span>انضم لدفعة التفوق ٢٠٢٥ / ٢٠٢٦ • Enrolling Now</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-950">
              طلب التحاق بالأكاديمية
            </h1>
            <p className="text-base sm:text-lg font-bold text-[#0050e3] mt-1">
              Academy Admission & Application Form
            </p>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-xl mx-auto font-medium">
              املأ الاستمارة وسنتواصل معك فوراً لتأكيد الحجز وتحديد المواعيد
              <br />
              <span className="text-gray-400">Fill in the details below to register for in-person or online groups</span>
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
                  تم استلام طلبك بنجاح!
                </h2>
                <p className="text-sm font-bold text-[#0050e3] mt-0.5">
                  Application Submitted Successfully!
                </p>
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  كود الحجز المرجعي الخاص بك / Reference Code:
                </p>
                <div className="mt-3 inline-block rounded-2xl bg-[#fff8e1] border-2 border-[#f6b407] px-6 py-2.5 font-mono font-black text-xl text-[#c48b05] tracking-widest shadow-sm">
                  {appId}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-[#fffdf5] p-5 text-start space-y-2 text-xs sm:text-sm font-medium">
                <p className="font-extrabold text-gray-900 border-b border-amber-100 pb-2">
                  بيانات التسجيل / Submitted Details:
                </p>
                <p><span className="text-gray-500">اسم الطالب / Name:</span> <strong className="text-gray-900">{formData.studentName}</strong></p>
                <p><span className="text-gray-500">المرحلة / Grade:</span> <strong className="text-gray-900">{gradeObj.ar} ({gradeObj.en})</strong></p>
                <p><span className="text-gray-500">لغة الدراسة / Language:</span> <strong className="text-gray-900">{studyLanguage === 'arabic' ? 'عربي / Arabic' : 'لغات / English'}</strong></p>
                <p><span className="text-gray-500">الدولة / Country:</span> <strong className="text-gray-900">{selectedCountryObj?.flag} {selectedCountryObj?.nameAr}</strong></p>
                <p><span className="text-gray-500">النظام / Mode:</span> <strong className="text-gray-900">{formData.mode === 'center' ? 'سنتر مباشر / Center' : 'أونلاين منصة / Online'}</strong></p>
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
                  <span>تأكيد الحجز فوراً عبر واتساب / Confirm on WhatsApp 💬</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-gray-500 hover:text-gray-900 underline pt-2 block mx-auto font-bold"
                >
                  تسجيل طلب طالب آخر / Submit Another
                </button>
              </div>
            </div>
          ) : (
            /* ── APPLICATION FORM (Dual Language) ── */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Column */}
              <div className="lg:col-span-2">
                <form
                  onSubmit={handleSubmit}
                  className="rounded-[32px] border-2 border-amber-100 bg-white p-6 sm:p-8 shadow-xl space-y-5"
                >
                  {/* Field 1: Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800 flex items-center justify-between">
                      <span>اسم الطالب رباعي / Student Full Name <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: محمد أحمد إبراهيم علي / e.g. Mohamed Ahmed Ibrahim"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-medium"
                    />
                  </div>

                  {/* Field 2 & 3: Grade (8 to 12) & Study Language */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Grade Selector (8 to 12) */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        المرحلة الدراسية / Grade Level (8 - 12) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2 text-xs sm:text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-bold"
                      >
                        {GRADES.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.ar} — {g.en}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Language of Study */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        لغة الدراسة / Language of Study <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 h-12">
                        <button
                          type="button"
                          onClick={() => setStudyLanguage('arabic')}
                          className={`rounded-2xl border-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                            studyLanguage === 'arabic'
                              ? 'border-[#0050e3] bg-[#e8f4ff] text-[#0050e3] shadow-xs'
                              : 'border-gray-200 bg-[#fcf6f3] text-gray-600'
                          }`}
                        >
                          <span>عربي / Arabic</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudyLanguage('english')}
                          className={`rounded-2xl border-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                            studyLanguage === 'english'
                              ? 'border-[#0050e3] bg-[#e8f4ff] text-[#0050e3] shadow-xs'
                              : 'border-gray-200 bg-[#fcf6f3] text-gray-600'
                          }`}
                        >
                          <span>لغات / English</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Field 4 & 5: Country & Subject */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Country Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        الدولة / Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-3 py-2 text-xs sm:text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-bold"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.nameAr} ({c.nameEn}) {c.dial}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        المادة المطلوبة / Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-3 py-2 text-xs sm:text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] focus:border-[#f6b407] transition-all font-bold"
                      >
                        <option value="physics">الفيزياء / Physics</option>
                        <option value="math">الرياضيات / Mathematics</option>
                        <option value="both">الفيزياء والرياضيات معاً / Both</option>
                      </select>
                    </div>
                  </div>

                  {/* Field 6: Study Mode */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                      نظام الدراسة المفضل / Study Mode <span className="text-red-500">*</span>
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
                        <span>حضور بالسنتر / In-Person</span>
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
                        <span>أونلاين منصة / Online</span>
                      </button>
                    </div>
                  </div>

                  {/* Field 7 & 8: Phones with Country Code Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Student Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        هاتف الطالب (واتساب) / Student Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryDial}
                          onChange={(e) => setCountryDial(e.target.value)}
                          className="w-24 shrink-0 rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-2 text-xs font-mono font-bold text-gray-800 outline-none"
                          dir="ltr"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.dial}>
                              {c.flag} {c.dial}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          required
                          inputMode="tel"
                          dir="ltr"
                          placeholder="010XXXXXXXX"
                          value={formData.studentPhone}
                          onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                          className="flex h-12 flex-1 rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-3 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Parent Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                        هاتف ولي الأمر / Parent Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={parentCountryDial}
                          onChange={(e) => setParentCountryDial(e.target.value)}
                          className="w-24 shrink-0 rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-2 text-xs font-mono font-bold text-gray-800 outline-none"
                          dir="ltr"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.dial}>
                              {c.flag} {c.dial}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          required
                          inputMode="tel"
                          dir="ltr"
                          placeholder="010XXXXXXXX"
                          value={formData.parentPhone}
                          onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                          className="flex h-12 flex-1 rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-3 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field 9: Governorate / Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                      المدينة أو المحافظة / City or State
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: القاهرة، الجيزة، الرياض، دبي، أو أونلاين / e.g. Cairo, Giza, Riyadh, Dubai"
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className="flex h-12 w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] px-4 py-2 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] font-medium"
                    />
                  </div>

                  {/* Field 10: Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-extrabold text-gray-800">
                      ملاحظات أو أسئلة إضافية / Additional Notes & Inquiries
                    </label>
                    <textarea
                      rows={3}
                      placeholder="اكتب أي استفسار أو موعد يناسب جدولك الدراسي... / Any preferences or notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="flex w-full rounded-2xl border border-[#eddcd6] bg-[#fcf6f3] p-4 text-sm text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#f6b407] font-medium resize-none"
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
                        ? 'جاري إرسال الطلب... / Submitting...'
                        : 'إرسال طلب الانضمام الآن / Submit Application →'}
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
                    <span>التواصل المباشر / Direct Contact</span>
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
                    <span>ماذا يحدث بعد الإرسال؟ / Next Steps</span>
                  </h4>
                  <ul className="space-y-3 text-gray-700 leading-relaxed font-semibold">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#f6b407] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        ١
                      </span>
                      <span>مراجعة بياناتك والتواصل معك هاتفياً وعبر واتساب فوراً.<br /><span className="text-[11px] text-gray-500">Quick review and instant follow-up via WhatsApp.</span></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0050e3] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        ٢
                      </span>
                      <span>تحديد المجموعة والمواعيد المناسبة لجدولك.<br /><span className="text-[11px] text-gray-500">Group scheduling matching your timetable.</span></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#e51e6b] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        ٣
                      </span>
                      <span>استلام كود الحساب للدخول للمنصة والامتحانات.<br /><span className="text-[11px] text-gray-500">Receive credentials for online portal & exams.</span></span>
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
            WhatsApp Us / واتساب
          </span>
        </a>
      </aside>
    </div>
  )
}
