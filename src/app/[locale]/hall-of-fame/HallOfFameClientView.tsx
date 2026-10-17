'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Star, ArrowLeft, ArrowRight, Award } from 'lucide-react'

export interface HonorStudent {
  id: string
  nameAr: string
  nameEn: string
  score: string
  rank: number
  achievementAr: string
  achievementEn: string
}

interface Props {
  locale: string
  students: HonorStudent[]
}

export function HallOfFameClientView({ locale, students }: Props) {
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const topThree = students.slice(0, 3)
  const remaining = students.slice(3)

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.svg"
              alt="Amr Academy"
              width={160}
              height={45}
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/apply`}
              className="rounded-md bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
            >
              {isAr ? 'تقديم طلب انضمام' : 'Apply to Join'}
            </Link>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{isAr ? 'الرئيسية' : 'Home'}</span>
              <Arrow className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="py-12 border-b border-border bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>{isAr ? 'لوحة الشرف — المتفوقون دراسياً' : 'Hall of Fame — Top Students'}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-3">
            {isAr ? 'أوائل ومتفوقي أكاديمية عمرو حاتم' : 'Honoring Top Achievers'}
          </h1>

          <p className="max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed">
            {isAr
              ? 'الطلاب الحاصلون على أعلى الدرجات والتقييمات المتميزة في امتحانات الفيزياء والرياضيات.'
              : 'Celebrating students who achieved outstanding results in Physics & Mathematics exams.'}
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="container mx-auto max-w-5xl px-4 py-10 space-y-10">
        {/* TOP 3 PODIUM */}
        {topThree.length > 0 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {isAr ? 'المراكز الأولى' : 'Top 3 Podium'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {topThree.map((st) => {
                const isFirst = st.rank === 1
                return (
                  <div
                    key={st.id}
                    className={`rounded-lg border p-5 bg-card flex flex-col justify-between transition-shadow hover:shadow-sm ${
                      isFirst
                        ? 'border-amber-400/80 dark:border-amber-500/60 ring-1 ring-amber-400/40 md:-translate-y-2'
                        : 'border-border'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl">
                          {st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : '🥉'}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {st.score}
                        </span>
                      </div>

                      {/* Name only and rank */}
                      <h3 className="font-bold text-base text-foreground mb-1">
                        {isAr ? st.nameAr : st.nameEn}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isAr ? st.achievementAr : st.achievementEn}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span>{isAr ? `الترتيب: #${st.rank}` : `Rank: #${st.rank}`}</span>
                      <Award className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* REMAINING STUDENTS LIST */}
        {remaining.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                {isAr ? `بقية الطلاب المتميزين (${remaining.length})` : `Honor Roll (${remaining.length})`}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {remaining.map((st) => (
                <div
                  key={st.id}
                  className="rounded-lg border border-border bg-card p-4 hover:border-foreground/20 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded border border-border bg-muted text-foreground">
                        #{st.rank}
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {st.score}
                      </span>
                    </div>

                    {/* ONLY Student name - NO ID! */}
                    <h3 className="font-semibold text-sm text-foreground mb-1">
                      {isAr ? st.nameAr : st.nameEn}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {isAr ? st.achievementAr : st.achievementEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback if no students */}
        {students.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {isAr ? 'جاري تحديث لوحة الشرف لدرجات الامتحانات الأخيرة.' : 'Updating honor list with recent exam results.'}
            </p>
          </div>
        )}

        {/* GitHub-style bottom CTA box */}
        <div className="rounded-lg border border-border bg-muted/40 p-6 text-center">
          <h3 className="font-bold text-base mb-1 text-foreground">
            {isAr ? 'تريد الانضمام للأكاديمية وحجز مقعدك؟' : 'Ready to join the academy?'}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {isAr
              ? 'سجل بياناتك وسيتم التواصل معك مباشرة لتحديد المواعيد والمجموعات المناسبة.'
              : 'Submit your application and our team will contact you directly.'}
          </p>
          <Link
            href={`/${locale}/apply`}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
          >
            <span>{isAr ? 'تقديم طلب انضمام' : 'Apply Now'}</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
