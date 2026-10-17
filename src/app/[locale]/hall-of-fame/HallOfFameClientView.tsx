'use client'

import { useState } from 'react'
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

export interface HonorStudent {
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

interface Props {
  locale: string
  students: HonorStudent[]
}

export function HallOfFameClientView({ locale, students }: Props) {
  const isAr = locale === 'ar'
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  const filteredStudents = students.filter((s) => {
    const matchGrade = selectedGrade === 'all' || s.grade === selectedGrade
    const matchSubject = selectedSubject === 'all' || s.subject === selectedSubject || s.subject === 'both'
    return matchGrade && matchSubject
  })

  const topThree = filteredStudents.slice(0, 3)
  const remaining = filteredStudents.slice(3)

  return (
    <div className={`min-h-screen bg-background text-foreground ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image
              src="/logo.svg"
              alt="Eng. Amr Hatem Academy"
              width={180}
              height={50}
              className="h-9 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/apply`}
              className="rounded-xl bg-[#F2B134] text-[#0F2A4A] px-4 py-2 text-xs sm:text-sm font-bold shadow hover:bg-[#F2B134]/90 transition-all hover:scale-105"
            >
              {isAr ? 'احجز مكانك معنا' : 'Join The Academy'}
            </Link>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              <span>{isAr ? 'الرئيسية' : 'Home'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0F2A4A] to-slate-950 py-16 sm:py-24 text-white">
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />

        <div className="container relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-300 backdrop-blur">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>{isAr ? 'لوحة شرف الأبطال — طلاب أ. عمرو حاتم' : 'Hall of Fame — Top Achievers'}</span>
          </div>

          <h1 className="mb-4 text-3xl font-black sm:text-5xl lg:text-6xl text-white">
            {isAr ? 'أوائل ومتفوقي أكاديمية عمرو حاتم' : 'Honoring Academic Excellence'}
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            {isAr
              ? 'فخورون بطلابنا الحقيقيين الذين اجتهدوا وحققوا أعلى الدرجات في امتحانات الفيزياء والرياضيات.'
              : 'Celebrating our top students who demonstrated commitment and outstanding mastery in Physics & Math.'}
          </p>
        </div>
      </section>

      {/* ── FILTERS ─────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/30 sticky top-16 z-40 backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          {/* Grade filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground me-1">{isAr ? 'المرحلة:' : 'Grade:'}</span>
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'sec3', labelAr: '٣ ثانوي', labelEn: 'Sec 3' },
              { id: 'sec2', labelAr: '٢ ثانوي', labelEn: 'Sec 2' },
              { id: 'sec1', labelAr: '١ ثانوي', labelEn: 'Sec 1' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGrade(g.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  selectedGrade === g.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                }`}
              >
                {isAr ? g.labelAr : g.labelEn}
              </button>
            ))}
          </div>

          {/* Subject filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground me-1">{isAr ? 'المادة:' : 'Subject:'}</span>
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'physics', labelAr: 'فيزياء', labelEn: 'Physics' },
              { id: 'math', labelAr: 'رياضيات', labelEn: 'Math' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  selectedSubject === s.id
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                }`}
              >
                {isAr ? s.labelAr : s.labelEn}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP 3 PODIUM ────────────────────────────────────────────────── */}
      {topThree.length > 0 && (
        <section className="py-12 bg-muted/10">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
                <span>{isAr ? 'المتصدرون ولوحة التتويج' : 'Top Achievers Podium'}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {topThree.map((st, i) => {
                const rankColor =
                  st.rank === 1 ? 'border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                  st.rank === 2 ? 'border-slate-300 bg-slate-500/10 text-slate-700 dark:text-slate-300' :
                  'border-amber-700 bg-amber-700/10 text-amber-800 dark:text-amber-500'

                return (
                  <div
                    key={st.id}
                    className={`rounded-2xl border-2 p-6 text-center shadow-lg transition-transform hover:-translate-y-1 bg-card ${
                      st.rank === 1 ? 'border-amber-400 md:-translate-y-4 shadow-amber-500/10' : 'border-border'
                    }`}
                  >
                    <div className="flex justify-center mb-3">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center font-black text-xl border-2 ${rankColor}`}>
                        {st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : '🥉'}
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-foreground mb-1">
                      {isAr ? st.nameAr : st.nameEn}
                    </h3>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 font-mono">
                      {st.score}
                    </p>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isAr ? st.achievementAr : st.achievementEn}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── ALL STUDENTS LIST ────────────────────────────────────────────── */}
      <section className="py-12 bg-background">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>{isAr ? `قائمة الطلاب المتميزين (${filteredStudents.length})` : `Honor Students (${filteredStudents.length})`}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((st) => (
              <div
                key={st.id}
                className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      #{st.rank}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {st.score}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground mb-1">
                    {isAr ? st.nameAr : st.nameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {isAr ? st.achievementAr : st.achievementEn}
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{st.subject === 'physics' ? (isAr ? 'فيزياء' : 'Physics') : (isAr ? 'رياضيات' : 'Math')}</span>
                  <span>{st.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-border bg-muted/20 text-center">
        <div className="container mx-auto max-w-3xl px-4">
          <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <h2 className="text-2xl font-black mb-2 text-foreground">
            {isAr ? 'مكانك القادم في لوحة الشرف ينتظرك!' : 'Your Place in the Hall of Fame Awaits!'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
            {isAr
              ? 'ابدأ رحلة تفوقك اليوم مع المهندس عمرو حاتم.. احجز مكانك في المجموعات الجديدة.'
              : 'Begin your journey to top grades with Eng. Amr Hatem today.'}
          </p>
          <Link
            href={`/${locale}/apply`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F2B134] text-[#0F2A4A] px-7 py-3 font-bold text-sm shadow-md hover:bg-[#F2B134]/90 transition-all hover:scale-105"
          >
            <span>{isAr ? 'سجّل الآن في الأكاديمية' : 'Enroll Now'}</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
