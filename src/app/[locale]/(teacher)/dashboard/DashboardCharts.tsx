'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign, CalendarCheck } from 'lucide-react'

interface MonthlyRevenue {
  month: string
  total: number
}

interface StudentGrowth {
  month: string
  count: number
}

interface Props {
  locale: string
  monthlyRevenue: MonthlyRevenue[]
  studentGrowth: StudentGrowth[]
}

export function DashboardCharts({ locale, monthlyRevenue, studentGrowth }: Props) {
  const isAr = locale === 'ar'

  const formatCurrency = (val: number) =>
    `EGP ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Student Growth Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {isAr ? 'نمو الطلاب (شهرياً)' : 'Student Registrations (Monthly)'}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {isAr ? 'آخر 12 شهر' : 'Last 12 months'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentGrowth.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              {isAr ? 'لا توجد بيانات نمو كافية' : 'No growth data available'}
            </div>
          ) : (
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={studentGrowth}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [val, isAr ? 'طلاب جدد' : 'New Students']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#growthGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Revenue Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              {isAr ? 'الإيرادات الشهرية' : 'Monthly Collected Revenue'}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {isAr ? 'المبالغ المحصلة' : 'Payments collected'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              {isAr ? 'لا توجد بيانات إيرادات كافية' : 'No revenue data available'}
            </div>
          ) : (
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyRevenue}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [`EGP ${val.toLocaleString()}`, isAr ? 'المحصل' : 'Collected']}
                  />
                  <Bar
                    dataKey="total"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
