'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  Award,
  Printer,
  Share2,
  Copy,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Star,
  Check,
} from 'lucide-react'
import { PremiumCertificate } from '@/components/certificates/PremiumCertificate'
import { printCertificateElement } from '@/lib/certificates/print'
import type { CertificateData } from '@/lib/certificates/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface TopExamItem {
  title: string
  percentage: number
  score: number
  total: number
}

interface Props {
  locale: string
  student: {
    id: string
    fullName: string
    studentCode: string
    enrolledOn: string
  }
  topExams: TopExamItem[]
  attendanceCount: number
}

export function StudentCertificatesClientView({
  locale,
  student,
  topExams,
  attendanceCount,
}: Props) {
  const isAr = locale === 'ar'
  const certRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://amr-academy.com'

  // Build certificates list for this student
  const certificatesList: CertificateData[] = useMemo(() => {
    const list: CertificateData[] = []

    // 1. Primary Academic Honors Certificate
    const primaryCode = `AMR-CERT-2026-${student.studentCode}`
    list.push({
      id: `cert-primary-${student.studentCode}`,
      verificationCode: primaryCode,
      studentName: student.fullName,
      studentCode: student.studentCode,
      titleAr: 'شـهـادة تـقـديـر وتـفـوق أكـاديـمـي',
      titleEn: 'Official Certificate of Academic Excellence',
      subtitleAr: 'تقديراً للريادة الأكاديمية والاجتهاد الاستثنائي في دراسة وحل مسائل الفيزياء والرياضيات',
      subtitleEn: 'In recognition of outstanding academic distinction in Physics & Mathematics',
      reasonAr: 'قد أظهر فهماً عميقاً واستيعاباً متميزاً للمفاهيم الفيزيائية وحل المسائل المتقدمة ببراعة واقتدار.',
      reasonEn: 'Demonstrated deep conceptual mastery and outstanding problem-solving skills in Physics.',
      scoreText: topExams[0]?.percentage ? `${topExams[0].percentage}%` : '100%',
      issueDate: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      verifyUrl: `${appOrigin}/${locale}/verify/certificate/${primaryCode}`,
      badgeIcon: '⚡',
    })

    // 2. Exam Excellence Certificate (if any exam >= 80%)
    if (topExams.length > 0 && topExams[0].percentage >= 80) {
      const topExam = topExams[0]
      const examCode = `AMR-CERT-EXAM-${student.studentCode}`
      list.push({
        id: `cert-exam-${student.studentCode}`,
        verificationCode: examCode,
        studentName: student.fullName,
        studentCode: student.studentCode,
        titleAr: topExam.percentage === 100
          ? 'شهادة الدرجة النهائية والكمال الأكاديمي (100%)'
          : `شهادة تفوق وتميز في ${topExam.title}`,
        titleEn: topExam.percentage === 100
          ? 'Full Marks Honors Certificate (100%)'
          : `Certificate of Excellence in ${topExam.title}`,
        subtitleAr: `تقديراً للأداء الاستثنائي وتحقيق أعلى الدرجات في ${topExam.title}`,
        subtitleEn: `In recognition of achieving top honors in ${topExam.title}`,
        reasonAr: `حقق الطالب المركز الأول بنسبة ${topExam.percentage}% (${topExam.score} من ${topExam.total}) بإجابة نموذجية متميزة.`,
        reasonEn: `Achieved ${topExam.percentage}% (${topExam.score}/${topExam.total}) with exemplary performance.`,
        scoreText: `${topExam.score} / ${topExam.total} (${topExam.percentage}%)`,
        issueDate: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        verifyUrl: `${appOrigin}/${locale}/verify/certificate/${examCode}`,
        badgeIcon: '💯',
      })
    }

    // 3. Perfect Attendance & Dedication Certificate
    if (attendanceCount >= 3) {
      const attendCode = `AMR-CERT-ATTEND-${student.studentCode}`
      list.push({
        id: `cert-attend-${student.studentCode}`,
        verificationCode: attendCode,
        studentName: student.fullName,
        studentCode: student.studentCode,
        titleAr: 'وسام الالتزام والمواظبة الأكاديمية المثالية',
        titleEn: 'Certificate of Dedication & Perfect Attendance',
        subtitleAr: `تقديراً للمواظبة التامة وحضور ${attendanceCount} حصة متتالية دون انقطاع`,
        subtitleEn: `In recognition of supreme dedication and perfect attendance across ${attendanceCount} sessions`,
        reasonAr: 'أظهر الطالب التزاماً حديدياً وأخلاقاً علمية رفيعة بالمواظبة التامة على حضور الحصص وإنجاز التمارين في مواعيدها.',
        reasonEn: 'Exemplified supreme discipline and dedication through flawless attendance and punctual submissions.',
        scoreText: `${attendanceCount} حصص متتالية`,
        issueDate: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        verifyUrl: `${appOrigin}/${locale}/verify/certificate/${attendCode}`,
        badgeIcon: '🌟',
      })
    }

    return list
  }, [student, topExams, attendanceCount, isAr, locale, appOrigin])

  const [selectedCertIndex, setSelectedCertIndex] = useState(0)
  const currentCert = certificatesList[selectedCertIndex] || certificatesList[0]

  useEffect(() => {
    if (currentCert?.verifyUrl) {
      QRCode.toDataURL(currentCert.verifyUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#0A192F', light: '#ffffff' },
      }).then(setQrUrl).catch(console.error)
    }
  }, [currentCert])

  const handlePrint = () => {
    if (certRef.current) {
      printCertificateElement(certRef.current)
    } else {
      window.print()
    }
  }

  const handleCopyVerifyUrl = () => {
    if (!currentCert) return
    navigator.clipboard.writeText(currentCert.verifyUrl)
    setCopied(true)
    toast.success(isAr ? 'تم نسخ رابط التحقق من الشهادة 📋' : 'Certificate link copied!')
    setTimeout(() => setCopied(false), 2500)
  }

  const waShareText = encodeURIComponent(
    `🎓 *شهادة تقدير وتفوق معتمدة — أكاديمية م. عمرو حاتم للفيزياء*\n\n` +
    `أنا فخور بحصولي على وسام: *${isAr ? currentCert.titleAr : currentCert.titleEn}*\n` +
    `كود الطالب: ${student.studentCode}\n` +
    `النتيجة: ${currentCert.scoreText || 'امتياز'}\n\n` +
    `🔗 *يمكنكم التحقق من صحة واعتماد الشهادة عبر الرابط الرسمي:*\n${currentCert.verifyUrl}\n\n` +
    `شكراً للمهندس عمرو حاتم وإدارة الأكاديمية على هذا الدعم والتقدير! 🚀`
  )

  const BackIcon = isAr ? ArrowRight : ArrowLeft

  return (
    <div className="space-y-6 pb-12 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href={`/${locale}/portal`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground font-bold transition-colors"
        >
          <BackIcon className="h-4 w-4" />
          <span>{isAr ? 'العودة للبوابة الرئيسية' : 'Back to Portal'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/portal/id-card`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold transition-colors shadow-xs"
          >
            <span>{isAr ? 'الكارنيه الذكي 💳' : 'Digital ID'}</span>
          </Link>

          <button
            onClick={handleCopyVerifyUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ رابط التوثيق' : 'Copy Link')}</span>
          </button>

          <a
            href={`https://wa.me/?text=${waShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-white text-xs font-black shadow-xs transition-transform hover:scale-105 active:scale-95"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{isAr ? 'مشاركة' : 'Share'}</span>
          </a>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0050e3] hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
          <Award className="h-6 w-6 text-[#f6b407]" />
          <span>{isAr ? 'شهادات التقدير والأوسمة الأكاديمية' : 'Certificates & Academic Honors'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
          {isAr
            ? 'شهادات رسمية معتمدة من م. عمرو حاتم مزودة برمز QR ورقم ترخيص موثق إلكترونياً'
            : 'Official verified credentials authenticated with QR code and secure verification ID'}
        </p>
      </div>

      {/* ── Certificate Switcher Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {certificatesList.map((cert, index) => {
          const isSelected = selectedCertIndex === index
          return (
            <button
              key={cert.id}
              onClick={() => setSelectedCertIndex(index)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-xs font-extrabold whitespace-nowrap transition-all ${
                isSelected
                  ? 'border-[#0050e3] bg-[#0050e3] text-white shadow-md scale-[1.02]'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              <span>{cert.badgeIcon || '🎖️'}</span>
              <span className="truncate max-w-[200px]">
                {isAr ? cert.titleAr : cert.titleEn}
              </span>
              {isSelected && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
          )
        })}
      </div>

      {/* ── Certificate Preview Sheet Canvas ── */}
      <div className="bg-slate-100 dark:bg-slate-950/80 rounded-3xl p-3 sm:p-6 shadow-inner">
        <div className="flex items-center justify-between pb-3 px-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{isAr ? 'وثيقة رسمية معتمدة قابلة للطباعة بحجم A4' : 'Official A4 Printable Credential'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
              {currentCert.verificationCode}
            </span>
          </div>
        </div>

        <div className="drop-shadow-2xl">
          <PremiumCertificate
            ref={certRef}
            data={currentCert}
            locale={locale}
            qrDataUrl={qrUrl}
          />
        </div>
      </div>

      {/* ── Security & Verification Info Card ── */}
      <div className="p-4 sm:p-5 rounded-3xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-black text-sm text-emerald-950 dark:text-emerald-200">
              {isAr ? 'شهادة إلكترونية مؤمنة وموثقة رسمياً' : 'Cryptographically Verified Credential'}
            </h4>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
              {isAr
                ? 'يمكن لأي جهة أو ولي أمر مسح رمز الـ QR أو فتح الرابط الموثق للتأكد من أصالة هذه الشهادة وبيانات الطالب المسجلة في الأكاديمية.'
                : 'Anyone can scan the QR code or open the verification link to confirm the authenticity of this certificate directly on the academy database.'}
            </p>
          </div>
        </div>

        <Link
          href={`/${locale}/verify/certificate/${currentCert.verificationCode}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs shrink-0 transition-all hover:scale-105 active:scale-95"
        >
          <span>{isAr ? 'فتح صفحة التحقق العامة' : 'Open Public Verification'}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
