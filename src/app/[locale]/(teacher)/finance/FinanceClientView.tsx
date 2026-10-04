'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import {
  CreditCard,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RecordPaymentDialog, StudentOption } from './RecordPaymentDialog'
import { generateMonthlyChargesAction, voidPaymentAction } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface ChargeItem {
  id: string
  student_id: string
  student_code: string
  student_name: string
  class_name: string
  description: string
  amount: number
  paid_amount: number
  remaining: number
  status: 'paid' | 'partially_paid' | 'unpaid'
  due_date: string
}

export interface PaymentItem {
  id: string
  receipt_no: string
  student_name: string
  student_code: string
  amount: number
  method: string
  paid_at: string
  voided_at: string | null
}

interface FinanceClientViewProps {
  stats: {
    collectedThisMonth: number
    totalOutstanding: number
    unpaidChargesCount: number
    totalPaymentsCount: number
  }
  students: StudentOption[]
  charges: ChargeItem[]
  payments: PaymentItem[]
}

export function FinanceClientView({
  stats,
  students,
  charges,
  payments,
}: FinanceClientViewProps) {
  const locale = useLocale()
  const router = useRouter()
  const isAr = locale === 'ar'

  const [activeTab, setActiveTab] = useState<'charges' | 'payments'>('charges')
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState(false)
  const [voidingId, setVoidingId] = useState<string | null>(null)

  const handleGenerateMonthly = async () => {
    try {
      setGenerating(true)
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const res = await generateMonthlyChargesAction(firstOfMonth, locale)

      if (res.success) {
        toast.success(
          isAr
            ? `تم توليد ${res.count} مطالبة شهرية للفصل الحالي`
            : `Generated ${res.count} monthly billing charges`
        )
        router.refresh()
      } else {
        toast.error('Failed to generate charges')
      }
    } catch {
      toast.error('Error')
    } finally {
      setGenerating(false)
    }
  }

  const handleVoidPayment = async (paymentId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من إلغاء هذه الدفعة المالية؟' : 'Are you sure you want to void this payment?')) return

    try {
      setVoidingId(paymentId)
      const res = await voidPaymentAction(paymentId, 'Voided by teacher', locale)
      if (res.success) {
        toast.success(isAr ? 'تم إلغاء الدفعة وإعادة فتح المستحقات' : 'Payment voided successfully')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to void')
      }
    } catch {
      toast.error('Error')
    } finally {
      setVoidingId(null)
    }
  }

  // Filter charges
  const filteredCharges = charges.filter((c) => {
    const q = search.toLowerCase().trim()
    return (
      !q ||
      c.student_name.toLowerCase().includes(q) ||
      c.student_code.toLowerCase().includes(q) ||
      c.class_name.toLowerCase().includes(q)
    )
  })

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase().trim()
    return (
      !q ||
      p.student_name.toLowerCase().includes(q) ||
      p.student_code.toLowerCase().includes(q) ||
      p.receipt_no.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <span>{isAr ? 'الإدارة المالية والمدفوعات' : 'Finance & Billing'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr
              ? 'متابعة الرسوم الشهرية، تسجيل المدفوعات، وإصدار الإيصالات بالجنيه المصري'
              : 'Manage student monthly fees, record payments, and issue receipts in EGP'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateMonthly}
            loading={generating}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{isAr ? 'توليد رسوم الشهر' : 'Generate Monthly Fees'}</span>
          </Button>

          <RecordPaymentDialog students={students} onSuccess={() => router.refresh()} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{isAr ? 'المتحصل هذا الشهر' : 'Collected This Month'}</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.collectedThisMonth.toLocaleString()} EGP</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{isAr ? 'إجمالي الرصيد المستحق' : 'Total Outstanding'}</span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats.totalOutstanding.toLocaleString()} EGP
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{isAr ? 'مطالبات غير مسددة' : 'Pending Charges'}</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.unpaidChargesCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{isAr ? 'عدد الإيصالات المصدرة' : 'Issued Receipts'}</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalPaymentsCount}</p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        {/* Tab Switcher */}
        <div className="flex rounded-lg border border-border bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('charges')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'charges'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isAr ? `المطالبات والرسوم (${charges.length})` : `Invoices & Charges (${charges.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'payments'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isAr ? `الإيصالات والمدفوعات (${payments.length})` : `Receipts & Payments (${payments.length})`}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'بحث بالاسم، الكود، أو الإيصال...' : 'Search student or receipt...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Tab 1: Charges Table */}
      {activeTab === 'charges' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'الطالب' : 'Student'}</th>
                  <th className="p-3 text-start">{isAr ? 'الفصل' : 'Class'}</th>
                  <th className="p-3 text-start">{isAr ? 'البيان' : 'Description'}</th>
                  <th className="p-3 text-start">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th className="p-3 text-start">{isAr ? 'المسدد' : 'Paid'}</th>
                  <th className="p-3 text-start">{isAr ? 'المتبقي' : 'Remaining'}</th>
                  <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-end">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCharges.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <p className="text-base font-semibold">{isAr ? 'لا توجد مطالبات' : 'No charges found'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredCharges.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">
                        <p className="text-foreground">{c.student_name}</p>
                        <span className="font-mono text-xs text-muted-foreground">{c.student_code}</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{c.class_name}</td>
                      <td className="p-3 text-xs">{c.description}</td>
                      <td className="p-3 font-bold text-foreground">{c.amount} EGP</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {c.paid_amount} EGP
                      </td>
                      <td className="p-3 font-bold text-rose-600 dark:text-rose-400">
                        {c.remaining} EGP
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={c.status === 'paid' ? 'default' : 'secondary'}
                          className={
                            c.status === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : c.status === 'partially_paid'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                          }
                        >
                          {c.status === 'paid'
                            ? isAr ? 'مسدد' : 'Paid'
                            : c.status === 'partially_paid'
                            ? isAr ? 'سداد جزئي' : 'Partial'
                            : isAr ? 'غير مسدد' : 'Unpaid'}
                        </Badge>
                      </td>
                      <td className="p-3 text-end font-mono text-xs text-muted-foreground">
                        {c.due_date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments & Receipts */}
      {activeTab === 'payments' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'رقم الإيصال' : 'Receipt No'}</th>
                  <th className="p-3 text-start">{isAr ? 'الطالب' : 'Student'}</th>
                  <th className="p-3 text-start">{isAr ? 'المبلغ المستلم' : 'Amount'}</th>
                  <th className="p-3 text-start">{isAr ? 'طريقة الدفع' : 'Method'}</th>
                  <th className="p-3 text-start">{isAr ? 'تاريخ الدفع' : 'Paid At'}</th>
                  <th className="p-3 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <p className="text-base font-semibold">{isAr ? 'لا توجد مدفوعات مسجلة' : 'No payments found'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isVoided = !!p.voided_at
                    return (
                      <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${isVoided ? 'opacity-50 line-through' : ''}`}>
                        <td className="p-3 font-mono font-bold text-primary">
                          {p.receipt_no}
                        </td>
                        <td className="p-3 font-medium">
                          {p.student_name} ({p.student_code})
                        </td>
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {p.amount} EGP
                        </td>
                        <td className="p-3 text-xs capitalize text-muted-foreground">
                          {p.method.replace('_', ' ')}
                        </td>
                        <td className="p-3 text-xs font-mono text-muted-foreground">
                          {new Date(p.paid_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-end">
                          {!isVoided ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
                              onClick={() => handleVoidPayment(p.id)}
                              loading={voidingId === p.id}
                            >
                              {isAr ? 'إلغاء الإيصال' : 'Void'}
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                              {isAr ? 'ملغى' : 'Voided'}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
