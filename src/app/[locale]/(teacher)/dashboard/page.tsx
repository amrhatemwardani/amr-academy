import { Suspense } from 'react'
import { requireTeacher } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'
import {
  Users, BookOpen, CalendarCheck, CreditCard,
  TrendingUp, AlertCircle, Clock, BarChart2
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard',
}

// ─── Dashboard Summary Types ────────────────────────────────────────
type DashboardSummary = {
  total_students: number
  active_students: number
  total_classes: number
  today_attendance_pct: number | null
  today_absences: number
  total_revenue: number
  collected_this_month: number
  pending_balance: number
  upcoming_exams: number
}

// ─── Metric Card Component ──────────────────────────────────────────
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  format = 'number',
  variant = 'default',
}: {
  title: string
  value: number | null | undefined
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  format?: 'number' | 'currency' | 'percent'
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}) {
  const colorMap = {
    default:     { bg: 'bg-primary/10',     text: 'text-primary' },
    success:     { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    warning:     { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400' },
    destructive: { bg: 'bg-red-500/10',     text: 'text-red-600 dark:text-red-400' },
  }
  const colors = colorMap[variant]

  const formatted =
    value === null || value === undefined
      ? '—'
      : format === 'currency'
      ? `EGP ${value.toLocaleString('en-EG', { minimumFractionDigits: 2 })}`
      : format === 'percent'
      ? `${value.toFixed(1)}%`
      : value.toLocaleString()

  return (
    <Card className="card-hover">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{formatted}</p>
            {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Skeleton grid ──────────────────────────────────────────────────
function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Metrics Fetcher (async Server Component) ───────────────────────
async function DashboardMetrics() {
  const supabase = await createClient()

  // Call dashboard_summary RPC
  const { data, error } = await supabase.rpc('dashboard_summary')

  // On fresh DB (no seed data yet), data may be null — show zeros
  const summary: DashboardSummary = data ?? {
    total_students: 0,
    active_students: 0,
    total_classes: 0,
    today_attendance_pct: null,
    today_absences: 0,
    total_revenue: 0,
    collected_this_month: 0,
    pending_balance: 0,
    upcoming_exams: 0,
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Failed to load dashboard data. Check your Supabase connection.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        title="Total Students"
        value={summary.total_students}
        icon={Users}
        trend={`${summary.active_students} active`}
      />
      <MetricCard
        title="Active Classes"
        value={summary.total_classes}
        icon={BookOpen}
        variant="success"
      />
      <MetricCard
        title="Today's Attendance"
        value={summary.today_attendance_pct}
        icon={CalendarCheck}
        format="percent"
        variant={
          summary.today_attendance_pct === null
            ? 'default'
            : summary.today_attendance_pct >= 80
            ? 'success'
            : summary.today_attendance_pct >= 60
            ? 'warning'
            : 'destructive'
        }
        trend={summary.today_absences > 0 ? `${summary.today_absences} absent` : 'No absences today'}
      />
      <MetricCard
        title="Upcoming Exams"
        value={summary.upcoming_exams}
        icon={Clock}
        trend="Next 7 days"
        variant={summary.upcoming_exams > 0 ? 'warning' : 'default'}
      />
      <MetricCard
        title="Total Revenue"
        value={summary.total_revenue}
        icon={CreditCard}
        format="currency"
        variant="success"
      />
      <MetricCard
        title="Collected This Month"
        value={summary.collected_this_month}
        icon={TrendingUp}
        format="currency"
        variant="success"
      />
      <MetricCard
        title="Pending Balance"
        value={summary.pending_balance}
        icon={BarChart2}
        format="currency"
        variant={summary.pending_balance > 0 ? 'warning' : 'default'}
        trend="Outstanding"
      />
      <MetricCard
        title="Active Students"
        value={summary.active_students}
        icon={Users}
        trend={`of ${summary.total_students} total`}
        variant="default"
      />
    </div>
  )
}

import { DashboardCharts } from './DashboardCharts'

// ─── Dashboard Page ─────────────────────────────────────────────────
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireTeacher(locale)
  const supabase = await createClient()

  // Load chart data
  const [revenueRes, growthRes] = await Promise.all([
    (supabase.rpc as any)('chart_monthly_revenue', { p_months: 12 }),
    (supabase.rpc as any)('chart_student_growth', { p_months: 12 }),
  ])

  const monthlyRevenue = revenueRes.data || []
  const studentGrowth = growthRes.data || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back, <span className="font-medium text-foreground">{user.fullName}</span>
          </p>
        </div>
        <Badge variant="outline" className="hidden sm:flex">
          Amr Academy — SMS
        </Badge>
      </div>

      {/* Metrics grid — streamed */}
      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics />
      </Suspense>

      {/* Interactive Charts */}
      <DashboardCharts
        locale={locale}
        monthlyRevenue={monthlyRevenue}
        studentGrowth={studentGrowth}
      />
    </div>
  )
}
