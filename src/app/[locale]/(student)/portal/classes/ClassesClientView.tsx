'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen, Calendar, Clock, DollarSign, UserCheck, MessageSquare,
  Search, Sparkles, ChevronRight, Award, AlertCircle, CheckCircle2,
  Atom, FlaskConical, Dna, Calculator, Globe, Languages, Layers, ExternalLink
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface ClassEnrollmentItem {
  enrollmentId: string
  enrolledOn: string
  fee: number
  classId: string
  name: string
  subject: string
  level: string
  description: string
  schedule: { dow: number; start: string; end: string }[]
  isActive: boolean
  totalSessions: number
  attendedSessions: number
  attendanceRate: number
}

interface Props {
  locale: string
  classes: ClassEnrollmentItem[]
  teacherName: string
}

const DAY_NAMES: Record<number, { en: string; ar: string }> = {
  0: { en: 'Sunday', ar: 'الأحد' },
  1: { en: 'Monday', ar: 'الإثنين' },
  2: { en: 'Tuesday', ar: 'الثلاثاء' },
  3: { en: 'Wednesday', ar: 'الأربعاء' },
  4: { en: 'Thursday', ar: 'الخميس' },
  5: { en: 'Friday', ar: 'الجمعة' },
  6: { en: 'Saturday', ar: 'السبت' },
}

// Subject Theme Config
function getSubjectTheme(subject: string) {
  const s = (subject || '').toLowerCase()
  if (s.includes('math') || s.includes('رياضيات') || s.includes('جبر') || s.includes('هندسة')) {
    return {
      icon: Calculator,
      gradient: 'from-blue-600 to-indigo-700',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-900/50',
      lightBg: 'bg-blue-50/50 dark:bg-blue-950/20',
    }
  }
  if (s.includes('physic') || s.includes('فيزياء')) {
    return {
      icon: Atom,
      gradient: 'from-purple-600 to-violet-800',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-900/50',
      lightBg: 'bg-purple-50/50 dark:bg-purple-950/20',
    }
  }
  if (s.includes('chem') || s.includes('كيمياء')) {
    return {
      icon: FlaskConical,
      gradient: 'from-emerald-600 to-teal-800',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-900/50',
      lightBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    }
  }
  if (s.includes('bio') || s.includes('أحياء') || s.includes('علوم')) {
    return {
      icon: Dna,
      gradient: 'from-rose-600 to-pink-800',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-900/50',
      lightBg: 'bg-rose-50/50 dark:bg-rose-950/20',
    }
  }
  if (s.includes('eng') || s.includes('إنجليزي') || s.includes('لغة')) {
    return {
      icon: Globe,
      gradient: 'from-amber-600 to-orange-700',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-900/50',
      lightBg: 'bg-amber-50/50 dark:bg-amber-950/20',
    }
  }
  if (s.includes('عرب') || s.includes('نحو') || s.includes('بلاغة')) {
    return {
      icon: Languages,
      gradient: 'from-amber-700 to-yellow-800',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-900/50',
      lightBg: 'bg-amber-50/50 dark:bg-amber-950/20',
    }
  }
  return {
    icon: BookOpen,
    gradient: 'from-indigo-600 to-blue-700',
    badge: 'bg-primary/10 text-primary',
    border: 'border-border',
    lightBg: 'bg-muted/20',
  }
}

// Next upcoming session calculation
function getNextSessionInfo(
  schedule: { dow: number; start: string; end: string }[],
  isAr: boolean
): { text: string; isToday: boolean; isTomorrow: boolean } | null {
  if (!schedule || schedule.length === 0) return null

  const now = new Date()
  const currentDow = now.getDay() // 0 = Sunday, 6 = Saturday
  const currentHours = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTimeMinutes = currentHours * 60 + currentMinutes

  // Sort slots by day of week and start time
  const sorted = [...schedule].sort((a, b) => {
    if (a.dow === b.dow) return a.start.localeCompare(b.start)
    return a.dow - b.dow
  })

  // 1. Look for remaining session today
  const todaySlot = sorted.find((s) => {
    if (s.dow !== currentDow) return false
    const [h, m] = s.start.split(':').map(Number)
    return h * 60 + m > currentTimeMinutes - 30 // allow up to 30 min into session
  })

  if (todaySlot) {
    return {
      text: isAr
        ? `اليوم الساعة ${todaySlot.start}`
        : `Today at ${todaySlot.start}`,
      isToday: true,
      isTomorrow: false,
    }
  }

  // 2. Look for upcoming day in current week
  const upcomingThisWeek = sorted.find((s) => s.dow > currentDow)
  if (upcomingThisWeek) {
    const isTomorrow = upcomingThisWeek.dow === (currentDow + 1) % 7
    const dayName = DAY_NAMES[upcomingThisWeek.dow]
    return {
      text: isTomorrow
        ? (isAr ? `غداً الساعة ${upcomingThisWeek.start}` : `Tomorrow at ${upcomingThisWeek.start}`)
        : (isAr ? `${dayName.ar} الساعة ${upcomingThisWeek.start}` : `${dayName.en} at ${upcomingThisWeek.start}`),
      isToday: false,
      isTomorrow,
    }
  }

  // 3. Otherwise wrap around to first day next week
  const firstNextWeek = sorted[0]
  if (firstNextWeek) {
    const isTomorrow = firstNextWeek.dow === (currentDow + 1) % 7
    const dayName = DAY_NAMES[firstNextWeek.dow]
    return {
      text: isTomorrow
        ? (isAr ? `غداً الساعة ${firstNextWeek.start}` : `Tomorrow at ${firstNextWeek.start}`)
        : (isAr ? `${dayName.ar} الساعة ${firstNextWeek.start}` : `${dayName.en} at ${firstNextWeek.start}`),
      isToday: false,
      isTomorrow,
    }
  }

  return null
}

export function ClassesClientView({ locale, classes, teacherName }: Props) {
  const isAr = locale === 'ar'
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'today' | 'active'>('all')

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase()) ||
        c.level.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (filter === 'active') return c.isActive
      if (filter === 'today') {
        const next = getNextSessionInfo(c.schedule, isAr)
        return next?.isToday
      }

      return true
    })
  }, [classes, search, filter, isAr])

  return (
    <div className="space-y-6 pb-20" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top Header with Actions ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>{isAr ? 'فصولي ومقرراتي' : 'My Classes & Courses'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isAr
              ? `أنت مسجل في ${classes.length} فصل دراسي في أكاديمية عمرو`
              : `You are enrolled in ${classes.length} classes at Amr Academy`}
          </p>
        </div>

        {/* Ask Teacher shortcut */}
        <Link
          href={`/${locale}/portal/messages`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-sm hover:bg-primary/90 transition-colors shrink-0"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{isAr ? 'تواصل مع المعلم' : 'Message Teacher'}</span>
        </Link>
      </div>

      {/* ── Search & Filter Strip ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث باسم الفصل أو المادة...' : 'Search by class name or subject...'}
            className="w-full h-10 rounded-xl border border-input bg-background ps-9 pe-3.5 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({classes.length})
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filter === 'today'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {isAr ? 'حصص اليوم' : "Today's"}
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filter === 'active'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {isAr ? 'النشطة' : 'Active'}
          </button>
        </div>
      </div>

      {/* ── Classes Grid ──────────────────────────────────────────────── */}
      {filteredClasses.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center space-y-3">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
            <p className="font-bold text-base text-foreground">
              {classes.length === 0
                ? (isAr ? 'لست مسجلاً في أي فصول حالياً' : 'No classes found')
                : (isAr ? 'لا توجد فصول مطابقة للبحث' : 'No matching classes')}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isAr
                ? 'تواصل مع إدارة الأكاديمية أو المعلم لإضافتك إلى المجموعة المناسبة.'
                : 'Contact academy management or teacher to enroll in your groups.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredClasses.map((cls) => {
            const theme = getSubjectTheme(cls.subject)
            const SubjectIcon = theme.icon
            const nextSession = getNextSessionInfo(cls.schedule, isAr)

            return (
              <Card
                key={cls.enrollmentId}
                className={`overflow-hidden border shadow-md hover:shadow-lg transition-all flex flex-col justify-between ${theme.border}`}
              >
                {/* ── Card Header with Subject Banner ─────────────────── */}
                <div>
                  <div className={`p-4 bg-gradient-to-r ${theme.gradient} text-white flex items-start justify-between gap-3`}>
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                        <SubjectIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-black text-base sm:text-lg leading-snug tracking-tight">
                          {cls.name}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-white/80 mt-0.5">
                          <span>{cls.subject || (isAr ? 'مادة دراسية' : 'Subject')}</span>
                          {cls.level && (
                            <>
                              <span>•</span>
                              <span>{cls.level}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Badge className="bg-white/20 text-white backdrop-blur-md border-transparent text-[10px] font-bold shrink-0">
                      {cls.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'متوقف' : 'Inactive')}
                    </Badge>
                  </div>

                  {/* ── Next Session Indicator Banner ───────────────────── */}
                  {nextSession && (
                    <div
                      className={`px-4 py-2 border-b text-xs flex items-center justify-between gap-2 font-medium ${
                        nextSession.isToday
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-bold'
                          : 'bg-muted/40 text-muted-foreground border-border'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Clock className={`h-3.5 w-3.5 ${nextSession.isToday ? 'text-emerald-600 animate-pulse' : ''}`} />
                        <span>{isAr ? 'الحصة القادمة:' : 'Next session:'}</span>
                      </span>
                      <span>{nextSession.text}</span>
                    </div>
                  )}

                  {/* ── Card Content ────────────────────────────────────── */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {cls.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {cls.description}
                      </p>
                    )}

                    {/* Class Weekly Timetable */}
                    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{isAr ? 'جدول المواعيد الأسبوعي:' : 'Weekly Schedule:'}</span>
                      </p>

                      {cls.schedule.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          {isAr ? 'لم يحدد موعد ثابت' : 'No set timetable'}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {cls.schedule.map((slot, idx) => {
                            const day = DAY_NAMES[slot.dow] || { en: 'Day', ar: 'يوم' }
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-xs"
                              >
                                <span className="font-bold text-foreground">
                                  {isAr ? day.ar : day.en}
                                </span>
                                <span className="text-muted-foreground font-mono text-[11px] flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {slot.start} - {slot.end}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Attendance Performance Pill in this class */}
                    <div className="rounded-xl border border-border p-3 flex items-center justify-between gap-3 bg-background">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          cls.attendanceRate >= 80 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          <UserCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">
                            {isAr ? 'نسبة حضورك في هذا الفصل' : 'Your Attendance in Class'}
                          </p>
                          <p className="text-xs font-bold mt-0.5">
                            {cls.totalSessions > 0
                              ? `${cls.attendanceRate}% (${cls.attendedSessions}/${cls.totalSessions} ${isAr ? 'حصة' : 'sessions'})`
                              : (isAr ? 'لا توجد حصص مسجلة بعد' : 'No sessions recorded yet')}
                          </p>
                        </div>
                      </div>

                      {cls.totalSessions > 0 && (
                        <Badge
                          variant={cls.attendanceRate >= 80 ? 'default' : 'secondary'}
                          className={`text-[10px] ${
                            cls.attendanceRate >= 80 ? 'bg-emerald-600 text-white' : ''
                          }`}
                        >
                          {cls.attendanceRate >= 80 ? (isAr ? 'ملتزم ✓' : 'Regular ✓') : (isAr ? 'تنبيه' : 'Low')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Card Footer with Fees & Quick Actions ─────────────── */}
                <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                      {isAr ? 'الرسوم الشهرية' : 'Monthly Fee'}
                    </p>
                    <p className="text-sm font-black text-foreground">
                      {cls.fee > 0 ? `EGP ${cls.fee.toLocaleString()}` : (isAr ? 'مجاني' : 'Free')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${locale}/portal/messages`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium bg-background hover:bg-muted transition-colors shadow-sm"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      <span>{isAr ? 'استفسار' : 'Inquire'}</span>
                    </Link>

                    <Link
                      href={`/${locale}/portal/exams`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{isAr ? 'الامتحانات' : 'Exams'}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
