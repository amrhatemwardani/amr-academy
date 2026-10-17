'use client'

import { useState, useRef } from 'react'
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
} from 'lucide-react'

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

const TEMPLATES = [
  {
    id: 'physics_excellence',
    titleAr: 'شهادة تفوق وتميز في الفيزياء',
    titleEn: 'Certificate of Excellence in Physics',
    subtitleAr: 'تقديراً للأداء الأكاديمي الاستثنائي وحصد أعلى الدرجات في امتحانات الفيزياء',
    subtitleEn: 'In recognition of outstanding academic performance and top scores in Physics',
    icon: '⚡',
  },
  {
    id: 'full_mark',
    titleAr: 'شهادة الدرجة النهائية (60 / 60)',
    titleEn: 'Full Marks Honors Certificate',
    subtitleAr: 'تقديراً للإجابة النموذجية والحصول على الدرجة النهائية كاملة في الاختبار الشامل',
    subtitleEn: 'For achieving a perfect score in the comprehensive exam',
    icon: '💯',
  },
  {
    id: 'first_place',
    titleAr: 'شهادة المركز الأول على الأكاديمية',
    titleEn: '1st Place Academic Champion',
    subtitleAr: 'لحصول الطالب على المركز الأول والريادة في قائمة الشرف العامة لدفعة هذا العام',
    subtitleEn: 'For ranking 1st on the Academy Hall of Fame',
    icon: '🥇',
  },
  {
    id: 'commitment',
    titleAr: 'شهادة الالتزام والمثابرة الأكاديمية',
    titleEn: 'Dedication & Attendance Honors',
    subtitleAr: 'تقديراً للحضور الكامل بدون غياب وتسليم كافة الواجبات والتمارين في مواعيدها',
    subtitleEn: 'For perfect attendance and consistent timely submission of all tasks',
    icon: '🌟',
  },
]

export function CertificatesClientView({ locale, students }: Props) {
  const isAr = locale === 'ar'
  const certRef = useRef<HTMLDivElement>(null)

  const [selectedStudent, setSelectedStudent] = useState<StudentItem>(
    students[0] || { id: '1', name: 'أمل غندر', code: 'AMR-101', score: 100 }
  )
  const [template, setTemplate] = useState(TEMPLATES[0])
  const [customTitle, setCustomTitle] = useState('')
  const [customSubtitle, setCustomSubtitle] = useState('')
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

  const handlePrint = () => {
    window.print()
  }

  const certTitle = customTitle.trim() || (isAr ? template.titleAr : template.titleEn)
  const certSubtitle = customSubtitle.trim() || (isAr ? template.subtitleAr : template.subtitleEn)

  const waShareText = encodeURIComponent(
    `🎓 *شهادة تقدير وتفوق — أكاديمية م. عمرو حاتم*\n\n` +
    `يسرنا تهنئة الطالب البطل: *${selectedStudent.name}*\n` +
    `وسام: ${certTitle}\n` +
    `النتيجة: ${scoreText}\n` +
    `التاريخ: ${customDate}\n\n` +
    `مع أطيب التمنيات بمزيد من التفوق والنجاح الدائم!`
  )

  return (
    <div className="space-y-6 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Screen-only controls header ── */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-[#f6b407]" />
            <span>{isAr ? 'منصة إصدار شهادات التقدير والتفوق' : 'Certificates & Honors Generator'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">
            {isAr
              ? 'إنشاء وطباعة شهادات تقدير رسمية للطلاب المتفوقين بدقة عالية ومشاركتها فوراً'
              : 'Generate, print and share official high-resolution certificates for top students'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/?text=${waShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#25d366] hover:bg-[#20ba59] text-white px-4 py-2 text-xs font-black shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            <span>{isAr ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}</span>
          </a>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#0050e3] hover:bg-blue-700 text-white px-5 py-2 text-xs font-black shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── Grid: Editor Controls (Left/Top) & Live Preview (Right/Bottom) ── */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Controls Card */}
        <div className="rounded-3xl border-2 border-gray-100 bg-white p-5 sm:p-6 shadow-sm space-y-5">
          {/* 1. Select Student */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-800">
              {isAr ? '١. اختيار الطالب' : '1. Select Student'}
            </label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم...' : 'Search student...'}
                className="w-full rounded-xl border border-gray-200 bg-[#fcf6f3] ps-8 pe-3 py-1.5 text-xs font-medium outline-none focus:border-[#f6b407]"
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
              className="w-full rounded-2xl border border-gray-200 bg-[#fcf6f3] p-2.5 text-xs sm:text-sm font-black outline-none focus:border-[#f6b407]"
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
            <label className="text-xs font-extrabold text-gray-800">
              {isAr ? '٢. نوع ووسام الشهادة' : '2. Certificate Type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTemplate(t)
                    setCustomTitle('')
                    setCustomSubtitle('')
                  }}
                  className={`p-3 rounded-2xl border-2 text-start text-xs font-bold transition-all flex flex-col justify-between gap-1 ${
                    template.id === t.id
                      ? 'border-[#f6b407] bg-[#fff8e1] text-[#c48b05] shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {isAr ? 'الدرجة / النسبة المحققة' : 'Score / Grade'}
              </label>
              <input
                type="text"
                value={scoreText}
                onChange={(e) => setScoreText(e.target.value)}
                placeholder="100% أو 60/60"
                className="w-full rounded-xl border border-gray-200 bg-[#fcf6f3] px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {isAr ? 'تاريخ الإصدار' : 'Issue Date'}
              </label>
              <input
                type="text"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#fcf6f3] px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                {isAr ? 'عنوان مخصص (اختياري)' : 'Custom Title (optional)'}
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={isAr ? template.titleAr : template.titleEn}
                className="w-full rounded-xl border border-gray-200 bg-[#fcf6f3] px-3 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* ── Live Preview Canvas Container ── */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="w-full max-w-2xl bg-gray-100 rounded-3xl p-3 sm:p-5 shadow-inner">
            <div className="text-center pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              {isAr ? 'معاينة الشهادة للطباعة A4' : 'A4 Print Preview'}
            </div>
            
            {/* The Certificate Paper Element */}
            <div
              ref={certRef}
              id="printable-certificate"
              className="relative w-full aspect-[1.414/1] bg-[#fffdf5] rounded-2xl shadow-xl border-8 border-double border-[#d4af37] p-6 sm:p-10 flex flex-col justify-between text-center select-none overflow-hidden"
              style={{
                boxShadow: '0 20px 40px -15px rgba(212, 175, 55, 0.3)',
              }}
            >
              {/* Corner Ornaments */}
              <div className="absolute top-2 start-2 text-2xl text-[#d4af37] opacity-60">⚜️</div>
              <div className="absolute top-2 end-2 text-2xl text-[#d4af37] opacity-60">⚜️</div>
              <div className="absolute bottom-2 start-2 text-2xl text-[#d4af37] opacity-60">⚜️</div>
              <div className="absolute bottom-2 end-2 text-2xl text-[#d4af37] opacity-60">⚜️</div>

              {/* Watermark in center */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] text-9xl font-black">
                ⚛️
              </div>

              {/* Top Header */}
              <div className="relative z-10 space-y-1">
                <div className="inline-flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#f6b407] text-white flex items-center justify-center font-black text-sm">
                    ⚡
                  </div>
                  <span className="font-black text-xs sm:text-sm text-gray-900 tracking-wider">
                    {isAr ? 'أكاديمية المهندس عمرو حاتم' : 'ENG. AMR HATEM ACADEMY'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {isAr ? 'فيزياء ورياضيات الثانوية العامة' : 'Physics & Mathematics Excellence'}
                </p>
                <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mt-2" />
              </div>

              {/* Certificate Title & Student Name */}
              <div className="relative z-10 my-auto py-2 space-y-3">
                <h2 className="text-xl sm:text-3xl font-black text-[#8b6e14] tracking-tight font-serif">
                  {certTitle}
                </h2>

                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {isAr ? 'تمنح هذه الشهادة بكل فخر واعتزاز إلى الطالب البطل:' : 'This certificate is proudly awarded to:'}
                </p>

                {/* Big Student Name */}
                <div className="py-1">
                  <span className="text-2xl sm:text-4xl font-black text-gray-950 px-6 py-1 border-b-2 border-[#d4af37]/60 inline-block font-serif">
                    {selectedStudent.name}
                  </span>
                </div>

                {/* Subtitle / Reason */}
                <p className="text-xs sm:text-sm text-gray-700 max-w-md mx-auto leading-relaxed font-semibold">
                  {certSubtitle}
                </p>

                {/* Score Pill Badge */}
                {scoreText && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff8e1] border border-[#f6b407] px-4 py-1 text-xs sm:text-sm font-black text-[#c48b05]">
                    <span>النتيجة والدرجة:</span>
                    <span className="text-[#0050e3]">{scoreText}</span>
                  </div>
                )}
              </div>

              {/* Bottom Signatures & Seal */}
              <div className="relative z-10 pt-4 border-t border-[#d4af37]/30 flex items-end justify-between px-2 sm:px-6 text-[10px] sm:text-xs">
                {/* Date */}
                <div className="text-start">
                  <p className="text-gray-400 font-bold">{isAr ? 'تاريخ التكريم:' : 'Date:'}</p>
                  <p className="font-black text-gray-800">{customDate}</p>
                </div>

                {/* Golden Ribbon Seal in Center */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#c48b05] via-[#f6b407] to-[#ffe082] shadow-md flex items-center justify-center text-white text-xl border-2 border-white">
                    🎖️
                  </div>
                  <span className="text-[9px] font-black text-[#8b6e14] mt-0.5">SEAL OF HONOR</span>
                </div>

                {/* Teacher Signature */}
                <div className="text-end">
                  <p className="text-gray-400 font-bold">{isAr ? 'المشرف العام:' : 'Instructor:'}</p>
                  <p className="font-black text-gray-900 font-serif text-sm">م. عمرو حاتم</p>
                  <p className="text-[9px] text-gray-400">Eng. Amr Hatem</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CSS Print Stylesheet (Hides controls and prints clean certificate) ── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #printable-certificate,
          #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 98vh;
            margin: 0;
            border-width: 12px;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
