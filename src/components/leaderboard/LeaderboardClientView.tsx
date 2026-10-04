'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Trophy, Medal, Award, Flame, UserCheck, Star, Crown,
  TrendingUp, Sparkles, Filter, Search, ArrowUp, GraduationCap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface LeaderboardStudent {
  id: string
  code: string
  name: string
  examAverage: number
  examsCount: number
  attendanceRate: number
  totalSessions: number
  compositeScore: number
  rank: number
  classes: string[]
  badges: { labelEn: string; labelAr: string; icon: string; color: string }[]
}

interface Props {
  locale: string
  role: 'teacher' | 'student'
  currentStudentId?: string
  classes: { id: string; name: string }[]
  students: LeaderboardStudent[]
}

export function LeaderboardClientView({
  locale,
  role,
  currentStudentId,
  classes,
  students: initialStudents,
}: Props) {
  const isAr = locale === 'ar'
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Filter students by selected class
  const filteredStudents = useMemo(() => {
    return initialStudents
      .filter((s) => {
        const matchesClass = selectedClass === 'all' || s.classes.includes(selectedClass)
        const matchesSearch =
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase())
        return matchesClass && matchesSearch
      })
      .map((s, idx) => ({ ...s, rank: idx + 1 }))
  }, [initialStudents, selectedClass, search])

  const top3 = filteredStudents.slice(0, 3)
  const first = top3[0]
  const second = top3[1]
  const third = top3[2]

  const myRank = useMemo(() => {
    if (!currentStudentId) return null
    return filteredStudents.find((s) => s.id === currentStudentId) || null
  }, [filteredStudents, currentStudentId])

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-amber-500" />
            <span>{isAr ? 'لوحة المتفوقين ولوحة الشرف' : 'Academic Leaderboard & Hall of Fame'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isAr
              ? 'تكريم الطلاب الأكثر تميزاً والتزاماً في الامتحانات والحضور'
              : 'Honoring top academic performers in exam grades and attendance'}
          </p>
        </div>

        {/* Filter by class */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">{isAr ? 'جميع الفصول' : 'All Classes'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Student's Own Rank Banner (if student) ────────────────────── */}
      {role === 'student' && myRank && (
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-md overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center shadow-md shrink-0">
                #{myRank.rank}
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-primary flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isAr ? 'ترتيبك الحالي في لوحة الشرف:' : 'Your Current Standing:'}</span>
                </p>
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {isAr ? `المركز رقم ${myRank.rank} من بين ${filteredStudents.length} طالب` : `Ranked #${myRank.rank} of ${filteredStudents.length} students`}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="text-center px-3 py-1.5 rounded-xl bg-background border border-border">
                <p className="text-[10px] text-muted-foreground">{isAr ? 'متوسط الامتحانات' : 'Exam Avg'}</p>
                <p className="font-bold text-sm text-foreground">{myRank.examAverage}%</p>
              </div>
              <div className="text-center px-3 py-1.5 rounded-xl bg-background border border-border">
                <p className="text-[10px] text-muted-foreground">{isAr ? 'نسبة الحضور' : 'Attendance'}</p>
                <p className="font-bold text-sm text-emerald-600">{myRank.attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Top 3 Podium Cards ────────────────────────────────────────── */}
      {filteredStudents.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* 🥈 2nd Place */}
          {second && (
            <Card className="border border-slate-300 dark:border-slate-800 shadow-md bg-gradient-to-b from-slate-100/50 dark:from-slate-900/30 to-background text-center order-2 sm:order-1 sm:mt-6">
              <CardContent className="p-5 space-y-3">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-lg shadow-inner">
                  🥈 2
                </div>
                <div>
                  <h3 className="font-black text-base truncate">{second.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{second.code}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <Badge variant="outline" className="font-bold">
                    {second.examAverage}% {isAr ? 'امتحانات' : 'exams'}
                  </Badge>
                  <Badge variant="secondary" className="font-bold text-emerald-600">
                    {second.attendanceRate}% {isAr ? 'حضور' : 'att'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🥇 1st Place (Center / Taller) */}
          {first && (
            <Card className="border-2 border-amber-400 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-background text-center shadow-xl order-1 sm:order-2">
              <CardContent className="p-6 space-y-3.5">
                <div className="relative inline-block">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-amber-500 text-white font-black text-2xl shadow-lg ring-4 ring-amber-300 dark:ring-amber-600/50">
                    🥇
                  </div>
                  <Crown className="h-6 w-6 text-amber-500 absolute -top-3.5 left-1/2 -translate-x-1/2" />
                </div>
                <div>
                  <Badge className="bg-amber-500 text-white font-bold text-[10px] mb-1">
                    {isAr ? 'بطل الأكاديمية الأول' : 'Champion #1'}
                  </Badge>
                  <h3 className="font-black text-lg truncate">{first.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{first.code}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-bold border-amber-300">
                    {first.examAverage}% {isAr ? 'امتحانات' : 'exams'}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold border-emerald-300">
                    {first.attendanceRate}% {isAr ? 'حضور' : 'att'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🥉 3rd Place */}
          {third && (
            <Card className="border border-amber-700/30 shadow-md bg-gradient-to-b from-amber-700/10 to-background text-center order-3 sm:order-3 sm:mt-8">
              <CardContent className="p-5 space-y-3">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-700/20 text-amber-800 dark:text-amber-400 font-black text-lg shadow-inner">
                  🥉 3
                </div>
                <div>
                  <h3 className="font-black text-base truncate">{third.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{third.code}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <Badge variant="outline" className="font-bold">
                    {third.examAverage}% {isAr ? 'امتحانات' : 'exams'}
                  </Badge>
                  <Badge variant="secondary" className="font-bold text-emerald-600">
                    {third.attendanceRate}% {isAr ? 'حضور' : 'att'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Complete Standings Table ───────────────────────────────────── */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Medal className="h-4 w-4 text-primary" />
              <span>{isAr ? 'الترتيب العام للطلاب' : 'Full Student Standings'}</span>
            </CardTitle>

            <div className="relative w-full sm:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'بحث عن طالب...' : 'Search student...'}
                className="w-full h-8 rounded-lg border border-input bg-background ps-8 pe-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              {isAr ? 'لا توجد بيانات كافية للترتيب' : 'No leaderboard data available'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredStudents.map((s) => {
                const isCurrent = s.id === currentStudentId
                return (
                  <div
                    key={s.id}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                      isCurrent
                        ? 'bg-primary/10 border-s-4 border-s-primary'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    {/* Rank & Student Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          s.rank === 1
                            ? 'bg-amber-500 text-white shadow-sm'
                            : s.rank === 2
                            ? 'bg-slate-400 text-white'
                            : s.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {s.rank}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate text-foreground">
                            {s.name}
                          </p>
                          {isCurrent && (
                            <Badge className="bg-primary text-primary-foreground text-[10px]">
                              {isAr ? 'أنت' : 'You'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {s.code} • {s.classes.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    </div>

                    {/* Scores & Badges */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-end">
                      <div className="hidden sm:flex items-center gap-1">
                        {s.badges.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.color}`}
                            title={isAr ? b.labelAr : b.labelEn}
                          >
                            {b.icon} {isAr ? b.labelAr : b.labelEn}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-black text-sm font-mono text-primary">
                            {s.examAverage}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">امتحانات</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          {s.attendanceRate}% {isAr ? 'حضور' : 'att'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
