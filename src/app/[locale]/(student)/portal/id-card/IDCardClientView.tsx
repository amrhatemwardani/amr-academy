'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  CreditCard, Download, Printer, RotateCw, CheckCircle2, ShieldCheck,
  GraduationCap, School, Phone, Calendar, ArrowLeft, ArrowRight, Sparkles, QrCode
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  locale: string
  student: {
    id: string
    code: string
    fullName: string
    grade: string | null
    school: string | null
    phone: string | null
    parentPhone: string | null
    enrolledOn: string
    status: string
  }
  academyName: string
}

export function IDCardClientView({ locale, student, academyName }: Props) {
  const isAr = locale === 'ar'
  const [isFlipped, setIsFlipped] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const cardRef = useRef<HTMLDivElement>(null)

  // Generate QR code on mount
  useEffect(() => {
    const payload = JSON.stringify({
      id: student.id,
      code: student.code,
      name: student.fullName,
      academy: academyName,
    })

    QRCode.toDataURL(payload, {
      width: 256,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err))
  }, [student, academyName])

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/portal/profile`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          <span>{isAr ? 'العودة للملف الشخصي' : 'Back to Profile'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors shadow-sm"
          >
            <RotateCw className="h-3.5 w-3.5 text-primary" />
            <span>{isAr ? 'قلب البطاقة' : 'Flip Card'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{isAr ? 'طباعة الكارنيه' : 'Print ID'}</span>
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          <span>{isAr ? 'بطاقة الطالب الرقمية (ID Card)' : 'Digital Student ID Card'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {isAr
            ? 'كارنيه رسمي مزود برمز QR للتحقق السريع وتسجيل الحضور'
            : 'Official digital credential with QR code for verification & attendance'}
        </p>
      </div>

      {/* ── 3D Realistic ID Card Container ──────────────────────────── */}
      <div className="perspective-1000 py-4">
        <div
          ref={cardRef}
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full aspect-[1.586/1] rounded-3xl transition-transform duration-700 transform-style-3d cursor-pointer shadow-2xl select-none print:shadow-none print:aspect-auto print:h-[220px] ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* ════════════════ FRONT OF CARD ════════════════ */}
          <div
            className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-between overflow-hidden backface-hidden text-white"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #3b82f6 100%)',
            }}
          >
            {/* Holographic watermark decorative overlay */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-2xl" />

            {/* Top Bar of Card */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide uppercase leading-tight">
                    {academyName}
                  </h3>
                  <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-mono">
                    Official Student Pass
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <Badge className="bg-white/20 text-white backdrop-blur-md border-transparent text-[10px] font-bold">
                  {student.status === 'active' ? (isAr ? 'طالب مقيد' : 'Enrolled') : student.status}
                </Badge>
              </div>
            </div>

            {/* Middle: Student Details + QR Code */}
            <div className="relative z-10 flex items-center justify-between gap-4 py-1">
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="text-[10px] uppercase text-indigo-200 tracking-wider font-semibold">
                  {isAr ? 'اسم الطالب' : 'Student Name'}
                </p>
                <h2 className="text-lg sm:text-xl font-black truncate leading-tight tracking-tight">
                  {student.fullName}
                </h2>

                <div className="flex items-center gap-2 text-xs text-indigo-100 pt-0.5">
                  <span className="font-mono bg-white/20 px-2 py-0.5 rounded font-bold">
                    {student.code}
                  </span>
                  {student.grade && <span>• {student.grade}</span>}
                </div>
              </div>

              {/* QR Code */}
              <div className="shrink-0 bg-white p-1.5 rounded-2xl shadow-lg border-2 border-white/30">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Student QR Code"
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-contain"
                  />
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 bg-muted animate-pulse rounded-xl" />
                )}
              </div>
            </div>

            {/* Bottom Bar: Valid date & Serial */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/20 text-[10px] text-indigo-200 font-mono">
              <div className="flex items-center gap-1">
                <span>{isAr ? 'تاريخ الإصدار:' : 'Issued:'}</span>
                <span className="text-white font-bold">{student.enrolledOn}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-white/80">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>Verified Credential</span>
              </div>
            </div>
          </div>

          {/* ════════════════ BACK OF CARD ════════════════ */}
          <div
            className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-between overflow-hidden backface-hidden text-white"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
            }}
          >
            {/* Magnetic Stripe representation */}
            <div className="absolute top-6 left-0 right-0 h-10 bg-black/80 shadow-inner" />

            <div className="pt-14 space-y-2 text-[11px] text-slate-300">
              <p className="font-semibold text-white">
                {isAr ? 'تعليمات وقواعد الأكاديمية:' : 'Academy Terms & Rules:'}
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] leading-relaxed opacity-85">
                <li>{isAr ? 'يجب إبراز هذا الكارنيه عند دخول مقر الأكاديمية.' : 'Must be presented upon entering academy premises.'}</li>
                <li>{isAr ? 'يُستخدم رمز QR لتسجيل الحضور الذاتي والسريع.' : 'QR code is scanned for fast attendance tracking.'}</li>
                <li>{isAr ? 'هذه البطاقة شخصية ولا يجوز استخدامها من شخص آخر.' : 'This credential is non-transferable.'}</li>
              </ul>
            </div>

            {/* Emergency Contact & Barcode */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[9px]">{isAr ? 'للطوارئ والدعم الفني:' : 'Support & Emergency:'}</p>
                <p className="font-mono text-white font-bold">{student.parentPhone || student.phone || '01000000000'}</p>
              </div>

              <div className="text-end">
                <span className="font-mono font-bold tracking-widest text-xs text-white">
                  |||||||| | |||| || |||||
                </span>
                <p className="text-[9px] text-muted-foreground font-mono">{student.code}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Helpful Hint Card ────────────────────────────────────────── */}
      <Card className="border border-indigo-200/50 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <CardContent className="p-4 flex items-start gap-3 text-xs leading-relaxed text-indigo-950 dark:text-indigo-200">
          <QrCode className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-foreground">
              {isAr ? 'كيف تستخدم الكارنيه الذكي؟' : 'How to use your Digital ID?'}
            </p>
            <p className="text-muted-foreground">
              {isAr
                ? 'أظهر رمز الـ QR من شاشة هاتفك للمعلم أو موظف الاستقبال عند باب القاعة ليتم تسجيل حضورك في الحصة فورياً دون انتظار.'
                : 'Show this QR code from your phone to your teacher or receptionist at the door for rapid attendance logging.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
