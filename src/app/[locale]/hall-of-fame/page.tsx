'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Trophy,
  Medal,
  Star,
  Award,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Filter,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

interface HonorStudent {
  id: string
  nameAr: string
  nameEn: string
  year: string
  grade: 'sec1' | 'sec2' | 'sec3'
  subject: 'physics' | 'math' | 'both'
  score: string
  rank: number
  achievementAr: string
  achievementEn: string
  quoteAr?: string
  quoteEn?: string
}

const TOP_STUDENTS: HonorStudent[] = [
  {
    id: '1',
    nameAr: 'زياد عمرو الشافعي',
    nameEn: 'Ziad Amr El-Shafei',
    year: '2024',
    grade: 'sec3',
    subject: 'physics',
    score: '60 / 60 (100%)',
    rank: 1,
    achievementAr: 'الدرجة النهائية في الفيزياء — الثانوية العامة ٢٠٢٤',
    achievementEn: '100% Full Mark in Physics — Thanaweya Amma 2024',
    quoteAr: 'متابعة م. عمرو وامتحانات المنصة الدورية هي سر تفوقي وثقتي في الامتحان.',
    quoteEn: 'Eng. Amr’s continuous follow-ups and mock tests were the key to my 100% score.',
  },
  {
    id: '2',
    nameAr: 'مريم محمود عبد الله',
    nameEn: 'Mariam Mahmoud Abdullah',
    year: '2024',
    grade: 'sec3',
    subject: 'math',
    score: '118 / 120 (98.3%)',
    rank: 2,
    achievementAr: 'تفوق استثنائي في فروع الرياضيات البحتة والتطبيقية',
    achievementEn: 'Exceptional Distinction in Pure & Applied Mathematics',
    quoteAr: 'الرياضيات أصبحت مادتي المفضلة بعد فهم قوانين الاستاتيكا والتفاضل بعمق.',
    quoteEn: 'Math became my favorite subject after truly understanding calculus and statics.',
  },
  {
    id: '3',
    nameAr: 'عمر خالد الديب',
    nameEn: 'Omar Khaled El-Deeb',
    year: '2024',
    grade: 'sec3',
    subject: 'both',
    score: '99.2%',
    rank: 3,
    achievementAr: 'المركز الأول على المجموعة في الفيزياء والرياضيات معاً',
    achievementEn: 'Top of Group in both Physics and Mathematics',
    quoteAr: 'بنك الأسئلة والتدريب على الأفكار المستحدثة فرق معايا جداً.',
    quoteEn: 'The extensive question bank and tricky questions gave me tremendous confidence.',
  },
  {
    id: '4',
    nameAr: 'سلمى هاني توفيق',
    nameEn: 'Salma Hany Tawfik',
    year: '2024',
    grade: 'sec2',
    subject: 'physics',
    score: '100%',
    rank: 4,
    achievementAr: 'المركز الأول في امتحانات الموجات والضوء — الصف الثاني الثانوي',
    achievementEn: '1st Place in Waves & Optics Exams — Sec 2',
    quoteAr: 'شرح التجارب الفيزيائية جعل القوانين سهلة الحفظ والتطبيق.',
    quoteEn: 'Experiments and visual explanations made concepts stick instantly.',
  },
  {
    id: '5',
    nameAr: 'أحمد تامر عبد المنعم',
    nameEn: 'Ahmed Tamer Abdel-Moneim',
    year: '2023',
    grade: 'sec3',
    subject: 'physics',
    score: '59.5 / 60',
    rank: 5,
    achievementAr: 'كلية الهندسة جامعة القاهرة — دفعة ٢٠٢٣',
    achievementEn: 'Admitted to Faculty of Engineering, Cairo University',
    quoteAr: 'الأساس القوي في الفيزياء ساعدني في أول سنة هندسة بامتياز.',
    quoteEn: 'Strong foundation from Eng. Amr paved my way to top GPA in Engineering.',
  },
  {
    id: '6',
    nameAr: 'نور الدين ياسر',
    nameEn: 'Nour El-Din Yasser',
    year: '2024',
    grade: 'sec1',
    subject: 'both',
    score: '98.5%',
    rank: 6,
    achievementAr: 'المركز الأول في فيزياء ورياضيات الصف الأول الثانوي',
    achievementEn: 'First Honors in Physics & Mathematics — Sec 1',
    quoteAr: 'تأسيس ممتاز وطريقة شرح ممتعة تشجع على التفوق.',
    quoteEn: 'Outstanding fundamentals and engaging teaching style.',
  },
]

export default function HallOfFamePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const isAr = locale === 'ar'
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  const years = [
    { value: 'all', labelEn: 'All Years', labelAr: 'كل السنوات' },
    { value: '2024', labelEn: '2024', labelAr: '٢٠٢٤' },
    { value: '2023', labelEn: '2023', labelAr: '٢٠٢٣' },
  ]

  const grades = [
    { value: 'all', labelEn: 'All Grades', labelAr: 'جميع الصفوف' },
    { value: 'sec3', labelEn: 'Sec 3 (Thanaweya)', labelAr: 'الصف الثالث الثانوي' },
    { value: 'sec2', labelEn: 'Sec 2', labelAr: 'الصف الثاني الثانوي' },
    { value: 'sec1', labelEn: 'Sec 1', labelAr: 'الصف الأول الثانوي' },
  ]

  const subjects = [
    { value: 'all', labelEn: 'All Subjects', labelAr: 'جميع المواد' },
    { value: 'physics', labelEn: 'Physics', labelAr: 'الفيزياء' },
    { value: 'math', labelEn: 'Mathematics', labelAr: 'الرياضيات' },
    { value: 'both', labelEn: 'Physics & Math', labelAr: 'الفيزياء والرياضيات' },
  ]

  const filtered = TOP_STUDENTS.filter((s) => {
    if (selectedYear !== 'all' && s.year !== selectedYear) return false
    if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false
    if (selectedSubject !== 'all' && s.subject !== selectedSubject) return false
    return true
  })

  return (
    <div className={`min-h-screen bg-background ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/${locale}`}
              className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            <Link
              href={`/${locale}/apply`}
              className="rounded-xl bg-[#F2B134] text-[#0F2A4A] px-3.5 py-1.5 text-xs sm:text-sm font-bold shadow hover:bg-[#F2B134]/90 transition-colors"
            >
              {isAr ? 'التحق بنا' : 'Apply Now'}
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#07172B] via-[#0F2A4A] to-[#0A1D33] py-16 sm:py-20 text-white">
        <div className="container relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F2B134]/30 bg-[#F2B134]/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-[#F2B134]">
            <Trophy className="h-4 w-4" />
            <span>{isAr ? 'لوحة الشرف وتكريم أوائل الأكاديمية' : 'Hall of Fame & Academic Honors'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {isAr ? 'صناع التفوق ونجوم الفيزياء والرياضيات' : 'Stars of Physics & Mathematics'}
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-200 max-w-2xl mx-auto">
            {isAr
              ? 'نفتخر بتكريم الطلاب المتفوقين في اختبارات الثانوية العامة وامتحانات الأكاديمية الدورية تقديراً لاجتهادهم وتميزهم.'
              : 'Celebrating outstanding achievement, hard work, and exam excellence of our top-performing students.'}
          </p>
        </div>
      </section>

      {/* ── FILTERS BAR ────────────────────────────────────────────── */}
      <section className="sticky top-16 z-30 border-b border-border bg-card/95 backdrop-blur py-4 shadow-sm">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Filter className="h-4 w-4 text-primary" />
              <span>{isAr ? 'تصفية حسب:' : 'Filter By:'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Year Select */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {years.map((y) => (
                  <option key={y.value} value={y.value}>{isAr ? y.labelAr : y.labelEn}</option>
                ))}
              </select>

              {/* Grade Select */}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {grades.map((g) => (
                  <option key={g.value} value={g.value}>{isAr ? g.labelAr : g.labelEn}</option>
                ))}
              </select>

              {/* Subject Select */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {subjects.map((s) => (
                  <option key={s.value} value={s.value}>{isAr ? s.labelAr : s.labelEn}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── STUDENTS GRID ─────────────────────────────────────────── */}
      <main className="py-12 bg-background">
        <div className="container mx-auto max-w-6xl px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold">{isAr ? 'لا توجد نتائج مطابقة للتصفية الحالية' : 'No students found matching filters'}</p>
              <button
                type="button"
                onClick={() => { setSelectedYear('all'); setSelectedGrade('all'); setSelectedSubject('all'); }}
                className="mt-3 text-xs text-primary underline font-semibold"
              >
                {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((student) => {
                const isTopThree = student.rank <= 3
                return (
                  <div
                    key={student.id}
                    className={`relative rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between ${
                      student.rank === 1
                        ? 'border-[#F2B134] bg-gradient-to-b from-[#F2B134]/10 via-card to-card'
                        : isTopThree
                        ? 'border-primary/40 bg-card'
                        : 'border-border bg-card'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`flex items-center justify-center h-9 w-9 rounded-xl font-black text-sm shadow-md ${
                          student.rank === 1
                            ? 'bg-[#F2B134] text-[#0F2A4A]'
                            : student.rank === 2
                            ? 'bg-slate-300 text-slate-800'
                            : student.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        #{student.rank}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-muted-foreground">{student.year}</span>
                        <div className="h-2 w-2 rounded-full bg-[#14A3A3]" />
                        <span className="text-xs font-semibold text-primary">
                          {student.grade === 'sec3' ? (isAr ? '٣ ث' : 'Sec 3') : student.grade === 'sec2' ? (isAr ? '٢ ث' : 'Sec 2') : (isAr ? '١ ث' : 'Sec 1')}
                        </span>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold text-foreground">
                          {isAr ? student.nameAr : student.nameEn}
                        </h2>
                      </div>

                      <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {isAr ? 'الدرجة والنسبة' : 'Final Score'}
                        </span>
                        <span className="font-mono font-black text-sm text-primary">
                          {student.score}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-foreground leading-relaxed pt-1">
                        🏆 {isAr ? student.achievementAr : student.achievementEn}
                      </p>

                      {student.quoteAr && (
                        <p className="text-xs text-muted-foreground italic leading-relaxed pt-2 border-t border-border">
                          &ldquo;{isAr ? student.quoteAr : student.quoteEn}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-[#F2B134]">
                        <Star className="h-3.5 w-3.5 fill-[#F2B134]" />
                        <span className="font-semibold">{isAr ? 'متفوق معتمد' : 'Honor Student'}</span>
                      </span>
                      <span className="text-[11px] font-mono">Amr Academy</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── BOTTOM CTA ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#0F2A4A] via-[#14A3A3] to-[#0F2A4A] py-12 text-white text-center">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-bold mb-2">
            {isAr ? 'انضم إلى ركب الأوائل والمتفوقين مع م. عمرو حاتم' : 'Join The Stars of Tomorrow with Eng. Amr Hatem'}
          </h2>
          <p className="text-sm text-slate-200 mb-6">
            {isAr
              ? 'احجز مقعدك الآن في المجموعات الحضورية أو منصة البث المباشر وابدأ طريقك نحو الدرجة النهائية.'
              : 'Reserve your seat now in our classroom or online batches and excel in Physics & Math.'}
          </p>
          <Link
            href={`/${locale}/apply`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F2B134] text-[#0F2A4A] px-7 py-3 text-sm font-bold shadow-lg hover:bg-[#F2B134]/90 transition-all hover:scale-105"
          >
            <span>{isAr ? 'قدم طلب الانضمام للأكاديمية' : 'Apply For Admission'}</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
