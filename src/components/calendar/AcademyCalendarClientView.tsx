'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, BookOpen,
  FileText, DollarSign, Sparkles, Filter, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface CalendarEvent {
  id: string
  title: string
  subtitle?: string
  date: string // YYYY-MM-DD
  startTime?: string
  endTime?: string
  type: 'class' | 'exam' | 'payment'
  badge?: string
  link?: string
}

interface Props {
  locale: string
  role: 'teacher' | 'student'
  events: CalendarEvent[]
}

const DAYS_OF_WEEK = [
  { en: 'Sun', ar: 'الأحد', fullEn: 'Sunday', fullAr: 'الأحد' },
  { en: 'Mon', ar: 'الإثنين', fullEn: 'Monday', fullAr: 'الإثنين' },
  { en: 'Tue', ar: 'الثلاثاء', fullEn: 'Tuesday', fullAr: 'الثلاثاء' },
  { en: 'Wed', ar: 'الأربعاء', fullEn: 'Wednesday', fullAr: 'الأربعاء' },
  { en: 'Thu', ar: 'الخميس', fullEn: 'Thursday', fullAr: 'الخميس' },
  { en: 'Fri', ar: 'الجمعة', fullEn: 'Friday', fullAr: 'الجمعة' },
  { en: 'Sat', ar: 'السبت', fullEn: 'Saturday', fullAr: 'السبت' },
]

export function AcademyCalendarClientView({ locale, role, events }: Props) {
  const isAr = locale === 'ar'
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [filterType, setFilterType] = useState<'all' | 'class' | 'exam' | 'payment'>('all')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Month navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today.toISOString().split('T')[0])
  }

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Build grid days
  const calendarDays = useMemo(() => {
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = []
    const todayStr = new Date().toISOString().split('T')[0]

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const prevM = month === 0 ? 11 : month - 1
      const prevY = month === 0 ? year - 1 : year
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ dateStr, dayNum: d, isCurrentMonth: false, isToday: dateStr === todayStr })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ dateStr, dayNum: d, isCurrentMonth: true, isToday: dateStr === todayStr })
    }

    // Next month padding to fill complete grid of 35 or 42
    const totalCells = days.length > 35 ? 42 : 35
    const remaining = totalCells - days.length
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1
      const nextY = month === 11 ? year + 1 : year
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ dateStr, dayNum: d, isCurrentMonth: false, isToday: dateStr === todayStr })
    }

    return days
  }, [year, month, firstDayIndex, daysInMonth, daysInPrevMonth])

  // Events map by dateStr
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach((ev) => {
      if (filterType !== 'all' && ev.type !== filterType) return
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    })
    return map
  }, [events, filterType])

  const selectedDayEvents = eventsByDate[selectedDate] || []

  // Month title
  const monthName = currentDate.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <span>{isAr ? 'الجدول الأكاديمي والمواعيد' : 'Academic Schedule & Calendar'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isAr
              ? 'متابعة مواعيد الحصص، الامتحانات القادمة، وتواريخ الاستحقاق'
              : 'Track class sessions, upcoming exam windows, and payment due dates'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: 'all',     labelEn: 'All',      labelAr: 'الكل' },
            { key: 'class',   labelEn: 'Classes',  labelAr: 'الحصص' },
            { key: 'exam',    labelEn: 'Exams',    labelAr: 'الامتحانات' },
            { key: 'payment', labelEn: 'Payments', labelAr: 'المصروفات' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${
                filterType === f.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background hover:bg-muted text-muted-foreground'
              }`}
            >
              {isAr ? f.labelAr : f.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Calendar Grid (8 cols) ────────────────────── */}
        <div className="lg:col-span-8 space-y-3">
          <Card className="border shadow-md overflow-hidden">
            {/* Month Header Controller */}
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h2 className="font-bold text-base text-foreground capitalize">{monthName}</h2>

              <div className="flex items-center gap-1">
                <button
                  onClick={goToday}
                  className="px-2.5 py-1 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors mr-1"
                >
                  {isAr ? 'اليوم' : 'Today'}
                </button>
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                >
                  {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                >
                  {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Weekdays Strip */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-bold py-2 text-muted-foreground">
              {DAYS_OF_WEEK.map((d, i) => (
                <div key={i}>{isAr ? d.ar : d.en}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-border border-b border-border bg-background">
              {calendarDays.map((d, idx) => {
                const dayEvents = eventsByDate[d.dateStr] || []
                const isSelected = d.dateStr === selectedDate
                const hasClass = dayEvents.some((e) => e.type === 'class')
                const hasExam = dayEvents.some((e) => e.type === 'exam')
                const hasPayment = dayEvents.some((e) => e.type === 'payment')

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`min-h-[72px] sm:min-h-[85px] p-1.5 sm:p-2 text-start transition-all relative flex flex-col justify-between ${
                      !d.isCurrentMonth ? 'bg-muted/15 text-muted-foreground/50' : 'text-foreground'
                    } ${isSelected ? 'bg-primary/10 ring-2 ring-primary ring-inset' : 'hover:bg-muted/40'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                          d.isToday
                            ? 'bg-primary text-primary-foreground font-black'
                            : ''
                        }`}
                      >
                        {d.dayNum}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-muted-foreground hidden sm:inline">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event indicators dots / mini labels */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {hasClass && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm" title="Class Session" />
                      )}
                      {hasExam && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 shadow-sm animate-pulse" title="Exam" />
                      )}
                      {hasPayment && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" title="Payment" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span>{isAr ? 'حصة دراسية' : 'Class Session'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>{isAr ? 'امتحان / اختبار' : 'Exam Deadline'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>{isAr ? 'استحقاق مصروفات' : 'Tuition Due'}</span>
              </span>
            </div>
          </Card>
        </div>

        {/* ── Right Column: Selected Day Schedule (4 cols) ──────────── */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="border shadow-md">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>{isAr ? 'جدول اليوم المحدد' : 'Selected Day Schedule'}</span>
                <span className="font-mono text-xs text-primary font-bold">
                  {selectedDate}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {selectedDayEvents.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground space-y-1">
                  <CalendarIcon className="h-8 w-8 mx-auto opacity-30 text-muted-foreground" />
                  <p className="font-semibold">{isAr ? 'لا توجد مواعيد في هذا اليوم' : 'No events on this date'}</p>
                  <p className="text-[11px]">{isAr ? 'حدد يوماً آخر لعرض الحصص' : 'Select another day on the calendar'}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayEvents.map((ev) => {
                    const isClass = ev.type === 'class'
                    const isExam = ev.type === 'exam'
                    const isPayment = ev.type === 'payment'

                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                          isExam
                            ? 'border-rose-300 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20'
                            : isPayment
                            ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                            : 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {isClass && <BookOpen className="h-3.5 w-3.5 text-blue-600" />}
                            {isExam && <FileText className="h-3.5 w-3.5 text-rose-600" />}
                            {isPayment && <DollarSign className="h-3.5 w-3.5 text-emerald-600" />}
                            <span className="font-black text-sm text-foreground">{ev.title}</span>
                          </div>

                          <Badge
                            className={`text-[10px] font-bold ${
                              isExam
                                ? 'bg-rose-600 text-white'
                                : isPayment
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {ev.badge || (isExam ? 'Exam' : isPayment ? 'Tuition' : 'Class')}
                          </Badge>
                        </div>

                        {ev.subtitle && (
                          <p className="text-muted-foreground text-xs">{ev.subtitle}</p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                          {ev.startTime ? (
                            <span className="flex items-center gap-1 font-mono font-medium">
                              <Clock className="h-3 w-3" />
                              {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}
                            </span>
                          ) : (
                            <span className="italic">{isAr ? 'طوال اليوم' : 'All day'}</span>
                          )}

                          {ev.link && (
                            <Link
                              href={ev.link}
                              className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                            >
                              <span>{isAr ? 'عرض' : 'View'}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
