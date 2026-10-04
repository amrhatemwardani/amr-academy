'use client'

import { useState, useTransition } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, Users, BookOpen, CreditCard,
  AlertCircle, BarChart2, Activity,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────
interface MonthlyRevenue  { month: string; amount: number }
interface ClassAttendance { name: string; rate: number }
interface TopBalance      { student_code: string; full_name: string; balance: number }
interface StatusDist      { name: string; value: number }

interface Props {
  locale: string
  monthlyRevenue: MonthlyRevenue[]
  classAttendance: ClassAttendance[]
  topBalances: TopBalance[]
  statusDistribution: StatusDist[]
  stats: {
    totalCollected: number
    totalOutstanding: number
    totalStudents: number
    activeClasses: number
  }
}

// ── Palette ──────────────────────────────────────────────────────────
const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4']

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  inactive: '#f59e0b',
  suspended: '#ef4444',
  archived: '#6b7280',
}

const fmt = (n: number) => `EGP ${n.toLocaleString('en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

// ── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({
  title, value, icon: Icon, colorClass, sub,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ───────────────────────────────────────────────────
export function ReportsClientView({
  locale,
  monthlyRevenue,
  classAttendance,
  topBalances,
  statusDistribution,
  stats,
}: Props) {
  const isAr = locale === 'ar'

  return (
    <div className="space-y-6 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isAr ? 'التقارير والتحليلات' : 'Reports & Analytics'}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {isAr ? 'نظرة عامة على أداء الأكاديمية' : 'Academy performance overview'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title={isAr ? 'إجمالي المحصّل' : 'Total Collected'}
          value={fmt(stats.totalCollected)}
          icon={TrendingUp}
          colorClass="bg-emerald-500/10 text-emerald-600"
        />
        <KpiCard
          title={isAr ? 'المبالغ المستحقة' : 'Outstanding Balance'}
          value={fmt(stats.totalOutstanding)}
          icon={CreditCard}
          colorClass="bg-amber-500/10 text-amber-600"
          sub={isAr ? 'على جميع الطلاب' : 'Across all students'}
        />
        <KpiCard
          title={isAr ? 'إجمالي الطلاب' : 'Total Students'}
          value={stats.totalStudents.toString()}
          icon={Users}
          colorClass="bg-primary/10 text-primary"
        />
        <KpiCard
          title={isAr ? 'الفصول النشطة' : 'Active Classes'}
          value={stats.activeClasses.toString()}
          icon={BookOpen}
          colorClass="bg-indigo-500/10 text-indigo-600"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-emerald-600" />
              {isAr ? 'الإيرادات الشهرية (6 أشهر)' : 'Monthly Revenue (Last 6 Months)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.every((m) => m.amount === 0) ? (
              <EmptyChart isAr={isAr} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number) => [fmt(value), isAr ? 'الإيرادات' : 'Revenue']}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Student Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              {isAr ? 'توزيع حالة الطلاب' : 'Student Status Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <EmptyChart isAr={isAr} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={10} />
                  <Tooltip formatter={(value) => [value, isAr ? 'طالب' : 'Students']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Rate per Class */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              {isAr ? 'نسبة الحضور لكل فصل' : 'Attendance Rate by Class'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classAttendance.length === 0 ? (
              <EmptyChart isAr={isAr} msg={isAr ? 'لا توجد سجلات حضور بعد' : 'No attendance records yet'} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={classAttendance}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, isAr ? 'نسبة الحضور' : 'Attendance']}
                  />
                  <Bar dataKey="rate" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {classAttendance.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.rate >= 80 ? '#10b981' : entry.rate >= 60 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Balances Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              {isAr ? 'أعلى الأرصدة المستحقة' : 'Highest Outstanding Balances'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topBalances.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                  <p>{isAr ? 'جميع الرسوم مدفوعة!' : 'All fees collected!'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {topBalances.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground font-mono w-5 text-center">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.student_code}</p>
                      </div>
                    </div>
                    <Badge variant="destructive" className="shrink-0 font-mono">
                      {fmt(s.balance)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Empty state for charts ───────────────────────────────────────────
function EmptyChart({ isAr, msg }: { isAr: boolean; msg?: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
      <div className="text-center">
        <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p>{msg || (isAr ? 'لا توجد بيانات كافية بعد' : 'Not enough data yet')}</p>
      </div>
    </div>
  )
}
