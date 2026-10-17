'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { Award, Printer, Download, X, Sparkles, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CertificateProps {
  open: boolean
  onClose: () => void
  studentName: string
  studentCode: string
  reason?: string
  date?: string
  locale?: string
}

export function CertificateModal({
  open,
  onClose,
  studentName,
  studentCode,
  reason,
  date,
  locale = 'ar',
}: CertificateProps) {
  const isAr = locale === 'ar'
  const certRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState('')

  const issueDate = date || new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    if (open) {
      const payload = JSON.stringify({
        cert: 'EXCELLENCE',
        name: studentName,
        code: studentCode,
        instructor: 'Eng. Amr Hatem',
        academy: 'Amr Hatem Academy for Physics & Mathematics',
        issuedAt: new Date().toISOString(),
      })

      QRCode.toDataURL(payload, {
        width: 180,
        margin: 1,
        color: { dark: '#0F2A4A', light: '#ffffff' },
      }).then(setQrUrl).catch(console.error)
    }
  }, [open, studentName, studentCode])

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-0 shadow-2xl">
        {/* Controls bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/40 no-print">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            <span className="font-semibold text-sm">
              {isAr ? 'شهادة تقدير وتفوق معتمدة' : 'Official Certificate of Excellence'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 bg-primary text-primary-foreground">
              <Printer className="h-4 w-4" />
              <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Certificate Container */}
        <div className="p-4 sm:p-8 overflow-x-auto flex justify-center bg-slate-100 dark:bg-slate-950">
          <div
            ref={certRef}
            className="certificate-print-sheet relative w-[800px] min-h-[560px] bg-white text-slate-900 shadow-2xl rounded-2xl p-10 flex flex-col justify-between border-8 border-double border-[#0F2A4A] overflow-hidden"
            dir={isAr ? 'rtl' : 'ltr'}
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(242, 177, 52, 0.05) 0%, transparent 70%)',
            }}
          >
            {/* Corner Decorative Accents */}
            <div className="absolute top-2 start-2 w-16 h-16 border-t-4 border-s-4 border-[#F2B134] rounded-tl-xl pointer-events-none" />
            <div className="absolute top-2 end-2 w-16 h-16 border-t-4 border-e-4 border-[#F2B134] rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-2 start-2 w-16 h-16 border-b-4 border-s-4 border-[#F2B134] rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-2 end-2 w-16 h-16 border-b-4 border-e-4 border-[#F2B134] rounded-br-xl pointer-events-none" />

            {/* Header: Logo and Title */}
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-1">
                <Image
                  src="/logo.svg"
                  alt="Amr Hatem Academy"
                  width={220}
                  height={68}
                  className="h-14 w-auto object-contain"
                />
              </div>
              <div className="inline-block px-4 py-1 rounded-full bg-[#0F2A4A]/5 border border-[#F2B134]/40">
                <p className="text-xs font-semibold tracking-widest uppercase text-[#0F2A4A]">
                  {isAr ? 'أكاديمية الفيزياء والرياضيات المتخصصة' : 'Physics & Mathematics Academy'}
                </p>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#0F2A4A] tracking-tight pt-2 font-serif">
                {isAr ? 'شـهـادة تـقـديـر وتـفـوق' : 'Certificate of Excellence'}
              </h1>
            </div>

            {/* Certificate Body */}
            <div className="my-6 text-center space-y-4">
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                {isAr
                  ? 'تشهد إدارة الأكاديمية والمهندس عمرو حاتم بأن الطالب / الطالبة:'
                  : 'Amr Hatem Academy and Eng. Amr Hatem proudly certify that:'}
              </p>

              {/* Student Name */}
              <div className="inline-block border-b-2 border-[#F2B134] pb-1 px-8 min-w-[320px]">
                <h2 className="text-2xl sm:text-3xl font-black text-[#0F2A4A] tracking-normal">
                  {studentName}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {studentCode}
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-700 max-w-xl mx-auto leading-relaxed pt-2">
                {reason || (isAr
                  ? 'قد أظهر تميزاً أكاديمياً فائقاً والتزاماً استثنائياً في دراسة وحل مسائل الفيزياء والرياضيات، وحقق أعلى معايير الاجتهاد والتفوق العلمي.'
                  : 'Has demonstrated exceptional academic distinction, high commitment to problem solving in Physics & Mathematics, and achieved outstanding results.')}
              </p>
            </div>

            {/* Footer: Signatures and QR Code */}
            <div className="pt-6 border-t border-slate-200 flex items-end justify-between px-4">
              {/* Date & Seal */}
              <div className="text-start space-y-1">
                <p className="text-xs text-slate-500">{isAr ? 'تاريخ المنح:' : 'Date Issued:'}</p>
                <p className="text-sm font-semibold text-slate-800">{issueDate}</p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium pt-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isAr ? 'شهادة إلكترونية موثقة' : 'Verified Digital Credential'}</span>
                </div>
              </div>

              {/* Verification QR */}
              {qrUrl && (
                <div className="flex flex-col items-center">
                  <div className="p-1.5 rounded-lg border border-[#F2B134]/50 bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrUrl} alt="Verification QR" className="h-16 w-16" />
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-mono">SCAN TO VERIFY</span>
                </div>
              )}

              {/* Teacher Signature */}
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500">{isAr ? 'معلم المادة وإدارة الأكاديمية' : 'Instructor & Director'}</p>
                <p className="text-lg font-black text-[#0F2A4A] font-serif tracking-tight">
                  م. عمرو حاتم
                </p>
                <p className="text-[10px] text-[#F2B134] font-bold tracking-wider uppercase">
                  Eng. Amr Hatem
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
