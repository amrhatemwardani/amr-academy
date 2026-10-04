import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { CreditCard, Receipt, AlertCircle, CheckCircle2, Clock, Wallet, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'My Payments' }

const METHOD_LABELS: Record<string, { en: string; ar: string }> = {
  cash: { en: 'Cash', ar: 'نقداً' },
  card: { en: 'Credit/Debit Card', ar: 'بطاقة بنكية' },
  mobile_wallet: { en: 'Mobile Wallet (Vodafone / Instapay)', ar: 'محفظة إلكترونية / إنستاباي' },
  bank_transfer: { en: 'Bank Transfer', ar: 'تحويل بنكي' },
  other: { en: 'Other', ar: 'أخرى' },
}

export default async function StudentPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireStudent(locale)
  const isAr = locale === 'ar'

  const admin = await createAdminClient()

  // 1. Fetch balance from student_balances view
  const { data: balanceData } = await (admin.from('student_balances' as any) as any)
    .select('balance, overdue')
    .eq('student_id', user.id)
    .single()

  const currentBalance = balanceData?.balance ? parseFloat(balanceData.balance) : 0
  const overdueAmount = balanceData?.overdue ? parseFloat(balanceData.overdue) : 0

  // 2. Fetch charges / invoices with class details
  const { data: rawCharges } = await (admin.from('charges' as any) as any)
    .select(`
      id, kind, period, description, amount, due_date, voided_at,
      classes ( name ),
      payment_allocations ( amount )
    `)
    .eq('student_id', user.id)
    .is('voided_at', null)
    .order('due_date', { ascending: false })

  const charges = ((rawCharges as any[]) || []).map((c: any) => {
    const totalAmount = parseFloat(c.amount) || 0
    const allocated = (c.payment_allocations || []).reduce(
      (sum: number, pa: any) => sum + (parseFloat(pa.amount) || 0),
      0
    )
    const remaining = Math.max(0, totalAmount - allocated)
    const status = remaining <= 0.01 ? 'paid' : allocated > 0 ? 'partial' : 'unpaid'

    return {
      id: c.id,
      description: c.description || (isAr ? 'رسوم دراسية' : 'Tuition Fee'),
      className: c.classes?.name || '',
      amount: totalAmount,
      paidAmount: allocated,
      remaining,
      dueDate: c.due_date,
      status,
    }
  })

  // 3. Fetch payment receipts
  const { data: rawPayments } = await (admin.from('payments' as any) as any)
    .select('id, receipt_no, amount, method, paid_at, reference, notes, voided_at')
    .eq('student_id', user.id)
    .is('voided_at', null)
    .order('paid_at', { ascending: false })

  const payments = ((rawPayments as any[]) || []).map((p: any) => ({
    id: p.id,
    receiptNo: p.receipt_no,
    amount: parseFloat(p.amount) || 0,
    method: p.method,
    paidAt: p.paid_at,
    reference: p.reference,
    notes: p.notes,
  }))

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6 pb-20" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          {isAr ? 'المدفوعات والمستحقات' : 'My Payments'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isAr ? 'متابعة المصروفات الدراسية وإيصالات السداد' : 'Track your tuition fees and payment receipts'}
        </p>
      </div>

      {/* Balance Hero Card */}
      <Card className="border shadow-sm overflow-hidden">
        <div className={`p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          currentBalance > 0
            ? 'bg-amber-500/10 border-b border-amber-500/20'
            : 'bg-emerald-500/10 border-b border-emerald-500/20'
        }`}>
          <div className="space-y-1">
            <p className="text-xs uppercase font-semibold text-muted-foreground">
              {isAr ? 'الرصيد المستحق حالياً' : 'Current Outstanding Balance'}
            </p>
            <div className="text-3xl font-black text-foreground">
              EGP {currentBalance.toLocaleString()}
            </div>
            {currentBalance > 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {isAr
                  ? `يرجى سداد المبلغ لدى إدارة الأكاديمية.`
                  : `Please settle the outstanding balance with the academy.`}
              </p>
            ) : (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isAr ? 'تم سداد كافة المستحقات!' : 'All fees are up to date!'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-background/80 p-3 border border-border text-center min-w-28 shadow-sm">
              <p className="text-[11px] text-muted-foreground">{isAr ? 'إجمالي ما تم سداده' : 'Total Paid'}</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">EGP {totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Receipts List */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            {isAr ? 'إيصالات الدفع الأخيرة' : 'Payment Receipts'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {isAr ? 'لا توجد إيصالات سداد مسجلة' : 'No payment receipts found'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((p) => {
                const methodLabel = METHOD_LABELS[p.method] || { en: p.method, ar: p.method }
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{p.receiptNo}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {isAr ? methodLabel.ar : methodLabel.en}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.paidAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {p.reference && <span> • {p.reference}</span>}
                      </p>
                    </div>

                    <div className="text-end">
                      <span className="text-sm font-bold text-emerald-600">
                        EGP {p.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charges & Invoices Breakdown */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-indigo-600" />
            {isAr ? 'المصروفات والمستحقات الدراسية' : 'Tuition Charges & Due Dates'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {charges.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {isAr ? 'لا توجد مستحقات مسجلة' : 'No charges recorded'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {charges.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{c.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {c.className && <span>{c.className}</span>}
                      <span>•</span>
                      <span>
                        {isAr ? 'تاريخ الاستحقاق: ' : 'Due: '}
                        {new Date(c.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-end space-y-1">
                    <div className="text-sm font-bold">
                      EGP {c.amount.toLocaleString()}
                    </div>
                    <div>
                      {c.status === 'paid' && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                          {isAr ? 'مدفوع بالكامل' : 'Paid in Full'}
                        </Badge>
                      )}
                      {c.status === 'partial' && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
                          {isAr ? `متبقي ${c.remaining} EGP` : `${c.remaining} EGP remaining`}
                        </Badge>
                      )}
                      {c.status === 'unpaid' && (
                        <Badge variant="destructive" className="text-[10px]">
                          {isAr ? 'مستحق الدفع' : 'Unpaid'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
