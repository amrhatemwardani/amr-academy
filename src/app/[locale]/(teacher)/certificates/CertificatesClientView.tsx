'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Award,
  Printer,
  Download,
  Share2,
  Sparkles,
  Search,
  CheckCircle2,
  Star,
  Trophy,
  User,
  Calendar,
  MessageSquare,
  Copy,
} from 'lucide-react'
import { PremiumCertificate } from '@/components/certificates/PremiumCertificate'
import { printCertificateElement } from '@/lib/certificates/print'
import { DEFAULT_CERTIFICATE_TEMPLATES, type CertificateData } from '@/lib/certificates/types'
import { toast } from 'sonner'

interface StudentItem {
  id: string
  name: string
  code: string
  score?: number
  className?: string
}

interface Props {
  locale: string
  students: StudentItem[]
}

export function CertificatesClientView({ locale, students }: Props) {
  const isAr = locale === 'ar'
  const certRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState('')

  const [selectedStudent, setSelectedStudent] = useState<StudentItem>(
    students[0] || { id: '1', name: 'طالب متميز', code: 'S1001', score: 100 }
  )
  const [template, setTemplate] = useState(DEFAULT_CERTIFICATE_TEMPLATES[0])
  const [customTitle, setCustomTitle] = useState('')
  const [customSubtitle, setCustomSubtitle] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [customDate, setCustomDate] = useState(
    new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  )
  const [scoreText, setScoreText] = useState('100%')
  const [search, setSearch] = useState('')

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  )

  const verificationCode = `AMR-CERT-2026-${selectedStudent.code}`
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://amr-academy.com'
  const verifyUrl = `${appOrigin}/${locale}/verify/certificate/${verificationCode}`

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      width: 180,
      margin: 1,
      color: { dark: '#0A192F', light: '#ffffff' },
    }).then(setQrUrl).catch(console.error)
  }, [verifyUrl])

  const handlePrint = () => {
    if (certRef.current) {
      printCertificateElement(certRef.current)
    } else {
      window.print()
    }
  }

  const certTitle = customTitle.trim() || (isAr ? template.titleAr : template.titleEn)
  const certSubtitle = customSubtitle.trim() || (isAr ? template.subtitleAr : template.subtitleEn)
  const certReason = customReason.trim() || (isAr ? template.reasonAr : template.reasonEn)

  const certData: CertificateData = {
    id: `cert-${selectedStudent.code}`,
    verificationCode,
    studentName: selectedStudent.name,
    studentCode: selectedStudent.code,
    titleAr: customTitle.trim() || template.titleAr,
    titleEn: customTitle.trim() || template.titleEn,
    subtitleAr: customSubtitle.trim() || template.subtitleAr,
    subtitleEn: customSubtitle.trim() || template.subtitleEn,
    reasonAr: certReason,
    reasonEn: certReason,
    scoreText,
    issueDate: customDate,
    instructorNameAr: 'م. عمرو حاتم',
    instructorNameEn: 'Eng. Amr Hatem',
    academyNameAr: 'أكاديمية المهندس عمرو حاتم',
    academyNameEn: 'Eng. Amr Hatem Academy',
    verifyUrl,
  }

  const waShareText = encodeURIComponent(
    `🎓 *شهادة تقدير وتفوق معتمدة — أكاديمية م. عمرو حاتم*\n\n` +
    `يسرنا تهنئة الطالب البطل: *${selectedStudent.name}* (ID: ${selectedStudent.code})\n` +
    `وسام التكريم: *${certTitle}*\n` +
    `النتيجة المحققة: ${scoreText}\n` +
    `تاريخ الإصدار: ${customDate}\n\n` +
    `🔗 *رابط التحقق الرقمي المعتمد:*\n${verifyUrl}\n\n` +
    `مع أطيب أمنيات م. عمرو حاتم وإدارة الأكاديمية بدوام التألق والتفوق الباهر! 🌟`
  )

  const handleCopyVerifyUrl = () => {
    navigator.clipboard.writeText(verifyUrl)
    toast.success(isAr ? 'تم نسخ رابط التحقق من الشهادة 📋' : 'Verification URL copied!')
  }

  return (
    <div className="space-y-6 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Screen-only controls header ── */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-[#f6b407]" />
            <span>{isAr ? 'منصة إصدار وتوثيق شهادات التقدير والتفوق' : 'Certificates & Honors Generator'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
            {isAr
              ? 'تصميم ملكي فاخر، ختم رسمي معتمد، رمز QR موثق للتحقق، وطباعة عالية الدقة بجودة A4'
              : 'Regal academic certificate styling with QR verification and high-resolution print'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyVerifyUrl}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111726] hover:bg-gray-50 px-3.5 py-2 text-xs font-bold shadow-xs transition-colors"
          >
            <Copy className="h-4 w-4 text-primary" />
            <span>{isAr ? 'نسخ رابط التوثيق' : 'Copy Verify URL'}</span>
          </button>

          <a
            href={`https://wa.me/?text=${waShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#25d366] hover:bg-[#20ba59] text-white px-4 py-2 text-xs font-black shadow-xs transition-transform hover:scale-105 active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            <span>{isAr ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}</span>
          </a>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#0050e3] hover:bg-blue-700 text-white px-5 py-2 text-xs font-black shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── Grid: Editor Controls (Left) & Live Preview (Right) ── */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Controls Card */}
        <div className="rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-5 sm:p-6 shadow-sm space-y-5">
          {/* 1. Select Student */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-800 dark:text-slate-200">
              {isAr ? '١. اختيار الطالب المكرم' : '1. Select Student'}
            </label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم أو الكود...' : 'Search student...'}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 ps-8 pe-3 py-1.5 text-xs font-medium outline-none focus:border-[#f6b407]"
              />
            </div>
            <select
              value={selectedStudent.id}
              onChange={(e) => {
                const s = students.find((st) => st.id === e.target.value)
                if (s) {
                  setSelectedStudent(s)
                  if (s.score) setScoreText(`${s.score}%`)
                }
              }}
              className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-2.5 text-xs sm:text-sm font-black outline-none focus:border-[#f6b407]"
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) {s.score ? `— ${s.score}%` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Template */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-800 dark:text-slate-200">
              {isAr ? '٢. نوع ووسام الشهادة' : '2. Certificate Type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_CERTIFICATE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTemplate(t)
                    setCustomTitle('')
                    setCustomSubtitle('')
                    setCustomReason('')
                  }}
                  className={`p-3 rounded-2xl border-2 text-start text-xs font-bold transition-all flex flex-col justify-between gap-1 ${
                    template.id === t.id
                      ? 'border-[#f6b407] bg-[#fff8e1] dark:bg-amber-950/30 text-[#c48b05] shadow-xs'
                      : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="line-clamp-2 leading-tight">
                    {isAr ? t.titleAr : t.titleEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Customize Fields */}
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                {isAr ? 'الدرجة / النسبة المحققة' : 'Score / Grade'}
              </label>
              <input
                type="text"
                value={scoreText}
                onChange={(e) => setScoreText(e.target.value)}
                placeholder="100% أو 60/60"
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                {isAr ? 'تاريخ التكريم والإصدار' : 'Issue Date'}
              </label>
              <input
                type="text"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                {isAr ? 'عنوان الشهادة المخصص (اختياري)' : 'Custom Title (optional)'}
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={isAr ? template.titleAr : template.titleEn}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 py-1.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                {isAr ? 'نص سبب التكريم (اختياري)' : 'Custom Citation / Reason (optional)'}
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={isAr ? template.reasonAr : template.reasonEn}
                rows={2}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 py-1.5 text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Live Preview Canvas Container ── */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-3xl p-3 sm:p-5 shadow-inner">
            <div className="flex items-center justify-between pb-3 px-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                {isAr ? 'معاينة الشهادة الفاخرة المعتمدة (A4 Landscape)' : 'Official A4 Landscape Certificate Preview'}
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                {verificationCode}
              </span>
            </div>

            {/* The Certificate Paper Element */}
            <div className="drop-shadow-2xl">
              <PremiumCertificate
                ref={certRef}
                data={certData}
                locale={locale}
                qrDataUrl={qrUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
