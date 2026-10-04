'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  QrCode, Scan, CheckCircle2, AlertCircle, Clock, ArrowLeft, ArrowRight,
  Sparkles, Volume2, VolumeX, Users, Calendar, BookOpen, Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { punchAttendanceAction } from './actions'

interface ClassOption {
  id: string
  name: string
  subject: string | null
  studentCount: number
}

interface ScannedStudent {
  id: string
  code: string
  name: string
  status: 'present' | 'late' | 'excused'
  isEnrolled: boolean
  timestamp: string
}

interface Props {
  locale: string
  classes: ClassOption[]
  initialAttendance: ScannedStudent[]
}

// Web Audio API synthesizer for instant punch sound
function playChime(success = true) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (success) {
      // Pleasant double chime: 587.33Hz (D5) -> 880Hz (A5)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } else {
      // Low buzz: 220Hz
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    }
  } catch {
    // Ignore audio permission restrictions
  }
}

export function AttendanceScannerClientView({ locale, classes, initialAttendance }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [inputVal, setInputVal] = useState('')
  const [punchStatus, setPunchStatus] = useState<'present' | 'late' | 'excused'>('present')
  const [punches, setPunches] = useState<ScannedStudent[]>(initialAttendance)
  const [lastScanned, setLastScanned] = useState<ScannedStudent | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep input focused continuously
  useEffect(() => {
    inputRef.current?.focus()
  }, [punches, selectedClassId])

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  function handlePunch(rawCode: string) {
    let clean = rawCode.trim()
    if (!clean || isPending || !selectedClassId) return

    // If input is JSON from QR code e.g. {"id":"...","code":"S1001",...}
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean)
        if (parsed.code) clean = parsed.code
        else if (parsed.id) clean = parsed.id
      } catch {
        // use raw
      }
    }

    startTransition(async () => {
      const res = await punchAttendanceAction({
        classId: selectedClassId,
        studentIdentifier: clean,
        date: date,
        status: punchStatus,
      })

      if (res?.error) {
        if (soundEnabled) playChime(false)
        toast.error(res.error)
      } else if (res.student) {
        if (soundEnabled) playChime(true)
        setLastScanned(res.student)
        setPunches((prev) => [
          res.student,
          ...prev.filter((p) => p.code !== res.student.code),
        ])
        toast.success(
          isAr
            ? `تم تسجيل ${res.student.name} (${res.student.code}) كـ ${
                res.student.status === 'present' ? 'حاضر' : res.student.status
              }`
            : `Marked ${res.student.name} (${res.student.code}) as ${res.student.status}`
        )
      }
      setInputVal('')
      inputRef.current?.focus()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handlePunch(inputVal)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top Header with Back to Standard Grid ────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/attendance`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          <span>{isAr ? 'العودة لجدول التحضير التقليدي' : 'Back to Attendance Grid'}</span>
        </Link>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors"
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="h-4 w-4 text-emerald-600" />
              <span>{isAr ? 'الصوت مفعّل' : 'Sound ON'}</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <span>{isAr ? 'الصوت معطل' : 'Sound OFF'}</span>
            </>
          )}
        </button>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
          <Scan className="h-6 w-6 text-primary" />
          <span>{isAr ? 'ماسح التحضير السريع (QR Scanner)' : 'Fast Attendance Scanner'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {isAr
            ? 'مسح كود الطالب بالباركود أو الـ QR لتسجيل حضوره فورياً بنقرة واحدة'
            : 'Scan student ID cards or enter codes for lightning-fast attendance logging'}
        </p>
      </div>

      {/* ── Controls: Class & Date & Status ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/20 p-4 rounded-2xl border border-border">
        {/* Class Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{isAr ? 'الفصل الدراسي:' : 'Class Group:'}</span>
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.studentCount} {isAr ? 'طالب' : 'students'})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{isAr ? 'تاريخ الحصة:' : 'Session Date:'}</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
          />
        </div>

        {/* Punch Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground">
            {isAr ? 'الحالة المسجلة:' : 'Marking as:'}
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['present', 'late', 'excused'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setPunchStatus(st)}
                className={`h-10 rounded-xl text-xs font-bold border transition-colors ${
                  punchStatus === st
                    ? st === 'present'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : st === 'late'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-600 text-white border-slate-600'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {st === 'present'
                  ? isAr ? 'حاضر' : 'Present'
                  : st === 'late'
                  ? isAr ? 'متأخر' : 'Late'
                  : isAr ? 'معذور' : 'Excused'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── High-Speed Scanner Input Card ────────────────────────────── */}
      <Card className="border-2 border-primary/30 shadow-xl overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <CardContent className="p-6 sm:p-8 space-y-6 text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 text-primary shadow-inner">
            <Scan className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black">
              {isAr ? 'جاهز للمسح الضوئي' : 'Ready to Scan or Type'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {isAr
                ? 'مرر باركود كارنيه الطالب أمام القارئ أو اكتب كود الطالب (مثال: S1001) واضغط Enter'
                : 'Scan student QR badge with scanner gun or type student code (e.g. S1001) and hit Enter'}
            </p>
          </div>

          {/* Large Scanner Input Box */}
          <div className="max-w-md mx-auto relative">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              placeholder={isAr ? 'اكتب أو امسح كود الطالب هنا...' : 'Scan or type student code...'}
              className="w-full h-14 rounded-2xl border-2 border-primary/40 bg-background px-4 text-center font-mono font-black text-lg sm:text-xl tracking-wider focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 shadow-lg"
            />

            <button
              onClick={() => handlePunch(inputVal)}
              disabled={!inputVal.trim() || isPending}
              className="absolute end-2 top-2 bottom-2 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {isPending ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                isAr ? 'تسجيل' : 'Punch'
              )}
            </button>
          </div>

          {/* Live Progress in current class */}
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {punches.length} {isAr ? 'طالب مسجل حضور' : 'students punched'}
              </span>
            </span>
            {selectedClass && (
              <>
                <span>•</span>
                <span>
                  {selectedClass.studentCount} {isAr ? 'إجمالي المقيدين' : 'total in class'}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Last Scanned Student Hero Banner ──────────────────────────── */}
      {lastScanned && (
        <Card className="border-2 border-emerald-500 bg-emerald-500/10 shadow-lg animate-in fade-in zoom-in-95 duration-300">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                ✓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-foreground">
                    {lastScanned.name}
                  </h3>
                  <Badge variant="outline" className="font-mono text-xs bg-background font-bold">
                    {lastScanned.code}
                  </Badge>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                  {isAr ? 'تم تسجيل الحضور بنجاح في تمام' : 'Attendance verified & logged at'}{' '}
                  <span className="font-mono font-bold">{lastScanned.timestamp}</span>
                </p>
              </div>
            </div>

            <Badge className="bg-emerald-600 text-white text-xs px-3 py-1 font-bold">
              {lastScanned.status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Punches Feed ───────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{isAr ? 'سجل الحضور اللحظي اليوم' : "Today's Live Punch Feed"}</span>
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {punches.length} {isAr ? 'طالب' : 'students'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {punches.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              {isAr ? 'لم يتم مسح أي طالب بعد في هذه الجلسة' : 'No students scanned yet in this session'}
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[350px] overflow-y-auto scrollbar-thin">
              {punches.map((p, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/20 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center font-mono font-bold text-[10px] text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-foreground">{p.name}</p>
                      <p className="text-muted-foreground font-mono text-[11px] mt-0.5">
                        {p.code} • {p.timestamp}
                      </p>
                    </div>
                  </div>

                  <Badge
                    className={
                      p.status === 'present'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : p.status === 'late'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {p.status === 'present' ? (isAr ? 'حاضر ✓' : 'Present ✓') : p.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
