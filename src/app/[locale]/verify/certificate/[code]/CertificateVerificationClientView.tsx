'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Award,
  Printer,
  Share2,
  Search,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Building2,
  GraduationCap,
} from 'lucide-react'
import { PremiumCertificate } from '@/components/certificates/PremiumCertificate'
import { printCertificateElement } from '@/lib/certificates/print'
import type { CertificateData } from '@/lib/certificates/types'
import { Button } from '@/components/ui/button'

interface Props {
  locale: string
  code: string
  isValid: boolean
  student: {
    code: string
    name: string
    enrolledOn: string
    topScore: number
    topExamTitle: string
  } | null
}

export function CertificateVerificationClientView({
  locale,
  code,
  isValid,
  student,
}: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const certRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [searchCode, setSearchCode] = useState('')

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://amr-academy.com'
  const verifyUrl = `${appOrigin}/${locale}/verify/certificate/${code}`

  useEffect(() => {
    if (isValid && student) {
      QRCode.toDataURL(verifyUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#0A192F', light: '#ffffff' },
      }).then(setQrUrl).catch(console.error)
    }
  }, [isValid, student, verifyUrl])

  const handlePrint = () => {
    if (certRef.current) {
      printCertificateElement(certRef.current)
    } else {
      window.print()
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = searchCode.trim().toUpperCase()
    if (!clean) return
    router.push(`/${locale}/verify/certificate/${clean}`)
  }

  const certData: CertificateData | null = student
    ? {
        id: `cert-${student.code}`,
        verificationCode: code,
        studentName: student.name,
        studentCode: student.code,
        titleAr: 'شـهـادة تـقـديـر وتـفـوق أكـاديـمـي',
        titleEn: 'Official Certificate of Academic Excellence',
        subtitleAr: 'تقديراً للريادة الأكاديمية والاجتهاد الاستثنائي في دراسة وحل مسائل الفيزياء والرياضيات',
        subtitleEn: 'In recognition of outstanding academic distinction in Physics & Mathematics',
        reasonAr: `قد أظهر فهماً عميقاً واستيعاباً متميزاً للمفاهيم الفيزيائية في ${student.topExamTitle} وحقق أعلى معايير الاجتهاد.`,
        reasonEn: `Demonstrated deep conceptual mastery and outstanding problem-solving skills in ${student.topExamTitle}.`,
        scoreText: `${student.topScore}% (امتياز)`,
        issueDate: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        instructorNameAr: 'م. عمرو حاتم',
        instructorNameEn: 'Eng. Amr Hatem',
        academyNameAr: 'أكاديمية المهندس عمرو حاتم',
        academyNameEn: 'Eng. Amr Hatem Academy',
        verifyUrl,
      }
    : null

  const BackIcon = isAr ? ArrowRight : ArrowLeft

  return (
    <div
      className="min-h-screen bg-[#fcfaf7] dark:bg-[#070b14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Top Navigation Bar ── */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackIcon className="h-4 w-4" />
            <span>{isAr ? 'الرئيسية للأكاديمية' : 'Academy Home'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border">
              {code}
            </span>
          </div>
        </div>

        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0A192F]/5 dark:bg-white/5 border border-[#D4AF37]/40 text-xs font-black text-[#0A192F] dark:text-[#F3E8A2]">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            <span>{isAr ? 'بوابة التحقق الرسمية من الشهادات الرقمية' : 'Official Digital Credential Verification Portal'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] dark:text-white tracking-tight">
            {isAr ? 'أكاديمية المهندس عمرو حاتم' : 'Eng. Amr Hatem Academy'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            {isAr
              ? 'التحقق الفوري من صحة ومصداقية الشهادات الممنوحة للطلاب بناءً على السجلات الرسمية'
              : 'Real-time cryptographic verification of official student honors and credentials'}
          </p>
        </div>

        {/* ── Verification Result Card ── */}
        {isValid && student && certData ? (
          <div className="rounded-3xl border-2 border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 sm:p-7 shadow-lg space-y-5">
            {/* Success Banner */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shrink-0">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                  ✓ {isAr ? 'شهادة معتمدة وموثقة 100%' : '100% Verified Authentic Credential'}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
                  {isAr ? `شهادة تقدير رسمية صادرة لـ ${student.name}` : `Official Honor Awarded to ${student.name}`}
                </h2>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  {isAr
                    ? 'هذه الوثيقة صادرة ومسجلة رسمياً بسجلات الأكاديمية وتحت إشراف مباشر من المهندس عمرو حاتم.'
                    : 'This credential is officially registered in our database under the direct supervision of Eng. Amr Hatem.'}
                </p>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
                <span className="text-[10px] text-muted-foreground font-bold block">{isAr ? 'اسم الطالب:' : 'Student Name:'}</span>
                <span className="text-xs sm:text-sm font-black truncate block text-foreground">{student.name}</span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
                <span className="text-[10px] text-muted-foreground font-bold block">{isAr ? 'كود الطالب:' : 'Student ID:'}</span>
                <span className="text-xs sm:text-sm font-mono font-black text-primary block">{student.code}</span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
                <span className="text-[10px] text-muted-foreground font-bold block">{isAr ? 'الدرجة المحققة:' : 'Achieved Score:'}</span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 block">{student.topScore}% (امتياز)</span>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
                <span className="text-[10px] text-muted-foreground font-bold block">{isAr ? 'حالة التوثيق:' : 'Status:'}</span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 block">✓ {isAr ? 'سارية ونشطة' : 'Active'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
              <Button
                size="sm"
                onClick={handlePrint}
                className="gap-2 bg-[#0050e3] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                <Printer className="h-4 w-4" />
                <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
              </Button>
            </div>

            {/* Interactive Certificate Paper Display */}
            <div className="pt-3">
              <div className="text-center pb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                {isAr ? 'معاينة النسخة الأصلية المعتمدة للشهادة' : 'Original Authenticated Certificate Document'}
              </div>
              <div className="drop-shadow-2xl max-w-[840px] mx-auto">
                <PremiumCertificate
                  ref={certRef}
                  data={certData}
                  locale={locale}
                  qrDataUrl={qrUrl}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Error / Invalid Banner */
          <div className="rounded-3xl border-2 border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-red-900 dark:text-red-200">
                {isAr ? 'لم يتم العثور على شهادة بهذا الرمز' : 'Certificate Not Found'}
              </h2>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1 max-w-md mx-auto">
                {isAr
                  ? `الرمز المدخل (${code}) غير مسجل في قاعدة بيانات الأكاديمية أو تم إلغاؤه. يرجى التأكد من كتابة كود الطالب أو رمز الشهادة بشكل صحيح.`
                  : `The code (${code}) was not found in our records. Please verify the code or student ID and try again.`}
              </p>
            </div>
          </div>
        )}

        {/* ── Search Another Code / Student Box ── */}
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h3 className="font-black text-sm text-foreground">
              {isAr ? 'التحقق من شهادة أخرى أو البحث بكود الطالب' : 'Verify Another Certificate or Student Code'}
            </h3>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder={isAr ? 'اكتب كود الطالب مثل: S1036 أو رمز الشهادة...' : 'Enter student code (e.g. S1036) or cert code...'}
              className="flex-1 rounded-2xl border border-border bg-muted/40 px-4 py-2.5 text-xs sm:text-sm font-bold outline-none focus:border-primary"
            />
            <Button type="submit" className="rounded-2xl gap-2 font-bold text-xs px-5">
              <span>{isAr ? 'تحقق الآن' : 'Verify Now'}</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
