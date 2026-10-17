'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { Award, Printer, Download, X, Share2, Sparkles, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PremiumCertificate } from './PremiumCertificate'
import { printCertificateElement } from '@/lib/certificates/print'
import type { CertificateData } from '@/lib/certificates/types'
import { toast } from 'sonner'

interface CertificateProps {
  open: boolean
  onClose: () => void
  studentName: string
  studentCode: string
  reason?: string
  date?: string
  locale?: string
  scoreText?: string
}

export function CertificateModal({
  open,
  onClose,
  studentName,
  studentCode,
  reason,
  date,
  locale = 'ar',
  scoreText = '100%',
}: CertificateProps) {
  const isAr = locale === 'ar'
  const certRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState('')

  const issueDate = date || new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const verificationCode = `AMR-CERT-2026-${studentCode}`
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://amr-academy.com'
  const verifyUrl = `${appOrigin}/${locale}/verify/certificate/${verificationCode}`

  useEffect(() => {
    if (open) {
      QRCode.toDataURL(verifyUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#0A192F', light: '#ffffff' },
      }).then(setQrUrl).catch(console.error)
    }
  }, [open, verifyUrl])

  const handlePrint = () => {
    if (certRef.current) {
      printCertificateElement(certRef.current)
    } else {
      window.print()
    }
  }

  const certData: CertificateData = {
    id: `cert-${studentCode}`,
    verificationCode,
    studentName,
    studentCode,
    titleAr: 'شـهـادة تـقـديـر وتـفـوق أكـاديـمـي',
    titleEn: 'Official Certificate of Academic Excellence',
    subtitleAr: 'تقديراً للريادة الأكاديمية والاجتهاد الاستثنائي في دراسة الفيزياء والرياضيات',
    subtitleEn: 'In recognition of outstanding academic distinction in Physics & Mathematics',
    reasonAr: reason || 'قد أظهر فهماً عميقاً واستيعاباً متميزاً للمفاهيم الفيزيائية وحل المسائل المتقدمة ببراعة واقتدار.',
    reasonEn: 'Demonstrated deep conceptual mastery and outstanding problem-solving skills in Physics.',
    scoreText,
    issueDate,
    instructorNameAr: 'م. عمرو حاتم',
    instructorNameEn: 'Eng. Amr Hatem',
    academyNameAr: 'أكاديمية المهندس عمرو حاتم',
    academyNameEn: 'Eng. Amr Hatem Academy',
    verifyUrl,
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl)
    toast.success(isAr ? 'تم نسخ رابط التحقق من الشهادة 📋' : 'Certificate verification link copied!')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-0 shadow-2xl">
        {/* Controls Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-muted/40 no-print">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm block leading-tight">
                {isAr ? 'شهادة التقدير والتفوق الأكاديمي الرسمية' : 'Official Certificate of Honors'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {verificationCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="gap-1.5 text-xs h-8 hidden sm:inline-flex"
            >
              <Share2 className="h-3.5 w-3.5 text-primary" />
              <span>{isAr ? 'نسخ رابط التوثيق' : 'Copy Verify URL'}</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 bg-[#0050e3] hover:bg-blue-700 text-white font-bold text-xs h-8 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
            </Button>

            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Certificate Display Canvas */}
        <div className="p-3 sm:p-6 overflow-x-auto flex justify-center bg-slate-100 dark:bg-slate-950/80">
          <div className="w-full max-w-[840px] drop-shadow-2xl">
            <PremiumCertificate
              ref={certRef}
              data={certData}
              locale={locale}
              qrDataUrl={qrUrl}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
