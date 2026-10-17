'use client'

import React, { forwardRef } from 'react'
import Image from 'next/image'
import type { CertificateData } from '@/lib/certificates/types'
import { ShieldCheck, Award, Sparkles, CheckCircle2 } from 'lucide-react'

interface PremiumCertificateProps {
  data: CertificateData
  locale?: string
  qrDataUrl?: string
  className?: string
}

export const PremiumCertificate = forwardRef<HTMLDivElement, PremiumCertificateProps>(
  function PremiumCertificate({ data, locale = 'ar', qrDataUrl, className = '' }, ref) {
    const isAr = locale === 'ar'

    const title = isAr ? data.titleAr : data.titleEn
    const subtitle = isAr ? (data.subtitleAr || '') : (data.subtitleEn || '')
    const reason = isAr
      ? (data.reasonAr || 'تقديراً للأداء الأكاديمي الاستثنائي والالتزام المتميز في دراسة وتفوق الفيزياء والرياضيات.')
      : (data.reasonEn || 'In recognition of outstanding academic performance and exceptional dedication to Physics & Mathematics.')
    const academyName = isAr
      ? (data.academyNameAr || 'أكاديمية المهندس عمرو حاتم')
      : (data.academyNameEn || 'Eng. Amr Hatem Academy')
    const instructorName = isAr
      ? (data.instructorNameAr || 'م. عمرو حاتم')
      : (data.instructorNameEn || 'Eng. Amr Hatem')

    return (
      <div
        ref={ref}
        id="printable-certificate"
        className={`certificate-sheet relative w-full aspect-[1.414/1] bg-[#FFFDF9] text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-10 flex flex-col justify-between border-[10px] border-[#0A192F] select-none overflow-hidden ${className}`}
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          boxShadow: '0 25px 60px -15px rgba(10, 25, 47, 0.35)',
        }}
      >
        {/* ── Inner Gold Foil Frame ── */}
        <div className="pointer-events-none absolute inset-2.5 sm:inset-3 border-2 border-[#D4AF37] rounded-xl" />
        <div className="pointer-events-none absolute inset-3.5 sm:inset-4 border border-[#F3E8A2]/60 rounded-lg" />

        {/* ── 4 Royal Filigree Corner Ornaments (SVG) ── */}
        <div className="pointer-events-none absolute top-4 start-4 w-12 h-12 text-[#D4AF37]">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full opacity-85">
            <path d="M0,0 L35,0 C35,20 20,35 0,35 Z M10,10 L10,25 C18,25 25,18 25,10 Z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M0,45 C30,45 45,30 45,0 L40,0 C40,25 25,40 0,40 Z" fill="#C59B27" />
          </svg>
        </div>
        <div className="pointer-events-none absolute top-4 end-4 w-12 h-12 text-[#D4AF37] scale-x-[-1]">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full opacity-85">
            <path d="M0,0 L35,0 C35,20 20,35 0,35 Z M10,10 L10,25 C18,25 25,18 25,10 Z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M0,45 C30,45 45,30 45,0 L40,0 C40,25 25,40 0,40 Z" fill="#C59B27" />
          </svg>
        </div>
        <div className="pointer-events-none absolute bottom-4 start-4 w-12 h-12 text-[#D4AF37] scale-y-[-1]">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full opacity-85">
            <path d="M0,0 L35,0 C35,20 20,35 0,35 Z M10,10 L10,25 C18,25 25,18 25,10 Z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M0,45 C30,45 45,30 45,0 L40,0 C40,25 25,40 0,40 Z" fill="#C59B27" />
          </svg>
        </div>
        <div className="pointer-events-none absolute bottom-4 end-4 w-12 h-12 text-[#D4AF37] scale-[-1]">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full opacity-85">
            <path d="M0,0 L35,0 C35,20 20,35 0,35 Z M10,10 L10,25 C18,25 25,18 25,10 Z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M0,45 C30,45 45,30 45,0 L40,0 C40,25 25,40 0,40 Z" fill="#C59B27" />
          </svg>
        </div>

        {/* ── Background Security Guilloche Watermark ── */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
          <svg width="400" height="400" viewBox="0 0 200 200" className="text-[#0A192F]">
            <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="100,20 120,80 180,100 120,120 100,180 80,120 20,100 80,80" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="100,35 115,85 165,100 115,115 100,165 85,115 35,100 85,85" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </svg>
        </div>

        {/* ── HEADER: Academy Crest, Name & Badge ── */}
        <div className="relative z-10 text-center space-y-1.5 pt-1">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C59B27] via-[#F3E8A2] to-[#D4AF37] p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0A192F] flex items-center justify-center text-[#F3E8A2]">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="text-start">
              <h3 className="font-black text-xs sm:text-sm tracking-wide text-[#0A192F] uppercase">
                {academyName}
              </h3>
              <p className="text-[9px] text-[#8B6E14] font-bold tracking-widest uppercase">
                {isAr ? 'المنظومة التعليمية المتخصصة للفيزياء والرياضيات' : 'Specialized Physics & Mathematics Academy'}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0A192F]/5 border border-[#D4AF37]/40 text-[9px] sm:text-[10px] font-black text-[#0A192F] uppercase tracking-widest">
            <Sparkles className="h-2.5 w-2.5 text-[#C59B27]" />
            <span>{isAr ? 'وثيقة تقدير وتكريم رسمي معتمدة' : 'Official Academic Honor Credential'}</span>
            <Sparkles className="h-2.5 w-2.5 text-[#C59B27]" />
          </div>

          {/* Certificate Main Title */}
          <div className="pt-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A192F] tracking-tight font-serif drop-shadow-xs">
              {title}
            </h1>
            <div className="flex items-center justify-center gap-3 pt-1">
              <div className="w-16 sm:w-28 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
              <span className="text-[#C59B27] text-xs">✦</span>
              <div className="w-16 sm:w-28 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
            </div>
          </div>
        </div>

        {/* ── BODY: Recipient & Honor Citation ── */}
        <div className="relative z-10 text-center space-y-2 my-auto py-2">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {isAr
              ? 'تشهد إدارة الأكاديمية والمهندس عمرو حاتم بأن الطالب / الطالبة المتميز:'
              : 'Amr Hatem Academy and Eng. Amr Hatem proudly certify that:'}
          </p>

          {/* Recipient Student Name */}
          <div className="inline-block relative">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A192F] px-8 py-1 tracking-tight font-serif">
              {data.studentName}
            </h2>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mt-0.5" />
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="font-mono text-[10px] sm:text-xs text-slate-700 font-bold bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full">
                ID: {data.studentCode}
              </span>
            </div>
          </div>

          {/* Citation / Reason */}
          <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed font-semibold pt-1">
            {reason}
          </p>

          {/* Score / Grade Achievement Pill */}
          {data.scoreText && (
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFF8E1] via-white to-[#FFF8E1] border border-[#D4AF37] px-4 py-1 text-xs font-black text-[#8B6E14] shadow-xs">
                <span>{isAr ? 'الدرجة المحققة:' : 'Achieved Score:'}</span>
                <span className="text-[#0050E3] font-black text-sm">{data.scoreText}</span>
                <span className="text-emerald-600 font-bold">★ {isAr ? 'امتياز مع مرتبة الشرف' : 'Distinction'}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER: Verification QR, Seal & Signature ── */}
        <div className="relative z-10 pt-3 border-t border-[#D4AF37]/35 flex items-end justify-between px-2 sm:px-6">
          {/* Left: Date & Security Credential */}
          <div className="text-start space-y-1 max-w-[180px]">
            <p className="text-[10px] text-slate-500 font-bold">{isAr ? 'تاريخ المنح والاعتماد:' : 'Date Issued:'}</p>
            <p className="text-xs sm:text-sm font-black text-slate-800 font-mono">{data.issueDate}</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold pt-0.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="truncate">{isAr ? 'شهادة رقمية موثقة' : 'Verified Digital Credential'}</span>
            </div>
            <p className="text-[8px] text-slate-400 font-mono truncate">
              {data.verificationCode}
            </p>
          </div>

          {/* Center: Imperial Golden Ribbon Seal */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Ribbon Ends */}
              <div className="absolute -bottom-3 -start-2 w-4 h-7 bg-[#A17C17] rotate-[-20deg] rounded-b-sm shadow-xs" />
              <div className="absolute -bottom-3 -end-2 w-4 h-7 bg-[#A17C17] rotate-[20deg] rounded-b-sm shadow-xs" />
              {/* Gold Medallion */}
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#946F0C] via-[#F3E8A2] to-[#D4AF37] p-1 shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#0A192F] border-2 border-[#F3E8A2] flex flex-col items-center justify-center text-white">
                  <span className="text-lg sm:text-xl leading-none">🎖️</span>
                  <span className="text-[7px] font-black text-[#F3E8A2] tracking-widest mt-0.5">VERIFIED</span>
                </div>
              </div>
            </div>
            <span className="text-[9px] font-black text-[#8B6E14] mt-1 tracking-wider uppercase font-mono">
              OFFICIAL SEAL
            </span>
          </div>

          {/* Right: Signature & Instructor */}
          <div className="flex items-end gap-3 text-end">
            {qrDataUrl && (
              <div className="hidden sm:flex flex-col items-center">
                <div className="p-1 rounded-lg border border-[#D4AF37]/50 bg-white shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="Verify QR" className="h-14 w-14 object-contain" />
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5 font-mono">SCAN TO VERIFY</span>
              </div>
            )}

            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-500 font-bold">{isAr ? 'المشرف العام ومؤسس الأكاديمية' : 'Academy Director & Instructor'}</p>
              <p className="text-base sm:text-lg font-black text-[#0A192F] font-serif tracking-tight">
                {instructorName}
              </p>
              <p className="text-[10px] text-[#C59B27] font-bold tracking-wider uppercase font-mono">
                Eng. Amr Hatem
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
