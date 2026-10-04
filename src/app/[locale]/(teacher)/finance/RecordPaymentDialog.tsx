'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Check, Copy, AlertCircle, CreditCard, Receipt } from 'lucide-react'
import { recordPaymentAction } from './actions'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'

export interface StudentOption {
  id: string
  student_code: string
  full_name: string
  outstandingBalance: number
}

interface RecordPaymentDialogProps {
  students: StudentOption[]
  onSuccess?: () => void
}

export function RecordPaymentDialog({ students, onSuccess }: RecordPaymentDialogProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '')
  const [amount, setAmount] = useState<string>('500')
  const [method, setMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'other'>('cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  // Receipt state
  const [receipt, setReceipt] = useState<{
    receiptNo: string
    studentName: string
    amount: number
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  const reset = () => {
    setSelectedStudentId(students[0]?.id || '')
    setAmount('500')
    setMethod('cash')
    setReference('')
    setNotes('')
    setError(null)
    setReceipt(null)
    setCopied(false)
  }

  const handleStudentSelect = (sid: string) => {
    setSelectedStudentId(sid)
    const st = students.find((s) => s.id === sid)
    if (st && st.outstandingBalance > 0) {
      setAmount(st.outstandingBalance.toString())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من 0' : 'Enter a valid amount greater than 0')
      return
    }

    try {
      setLoading(true)
      const res = await recordPaymentAction(
        {
          studentId: selectedStudentId,
          amount: numAmount,
          method,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        },
        locale
      )

      if (res.success && res.receiptNo) {
        setReceipt({
          receiptNo: res.receiptNo,
          studentName: selectedStudent?.full_name || 'Student',
          amount: numAmount,
        })
        toast.success(isAr ? 'تم تسجيل الدفعة وإصدار الإيصال' : 'Payment recorded successfully')
        if (onSuccess) onSuccess()
      } else {
        setError(res.error || 'Failed to record payment')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReceipt = () => {
    if (!receipt) return
    const text = isAr
      ? `إيصال استلام دفعة - أكاديمية عمرو\nرقم الإيصال: ${receipt.receiptNo}\nاسم الطالب: ${receipt.studentName}\nالمبلغ المستلم: ${receipt.amount} جنيه مصري\nطريقة الدفع: ${method}\nالتاريخ: ${new Date().toLocaleDateString('ar-EG')}`
      : `Payment Receipt - Amr Academy\nReceipt No: ${receipt.receiptNo}\nStudent: ${receipt.studentName}\nAmount: ${receipt.amount} EGP\nMethod: ${method}\nDate: ${new Date().toLocaleDateString()}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(isAr ? 'تم نسخ الإيصال' : 'Receipt copied to clipboard')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{isAr ? 'تسجيل دفعة جديدة' : 'Record Payment'}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span>{isAr ? 'تسجيل دفعة مالية' : 'Record Student Payment'}</span>
          </DialogTitle>
        </DialogHeader>

        {receipt ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{isAr ? 'تم الدفع بنجاح' : 'Payment Success'}</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20">
                  {receipt.receiptNo}
                </span>
              </div>
              <p className="font-bold text-lg">{receipt.amount} EGP</p>
              <p className="text-xs opacity-90">{receipt.studentName}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopyReceipt}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? (isAr ? 'تم نسخ الإيصال!' : 'Copied!') : (isAr ? 'نسخ نص الإيصال للواتساب' : 'Copy Receipt for WhatsApp')}</span>
            </Button>

            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                {isAr ? 'تم' : 'Done'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Student */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="payStudentSelect">{isAr ? 'الطالب' : 'Student'}</Label>
                {selectedStudent && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {isAr ? 'المستحق:' : 'Due:'}{' '}
                    <strong className="text-foreground">{selectedStudent.outstandingBalance} EGP</strong>
                  </span>
                )}
              </div>
              <select
                id="payStudentSelect"
                value={selectedStudentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_code} - {s.full_name} ({s.outstandingBalance} EGP)
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="payAmount">{isAr ? 'المبلغ المستلم (EGP)' : 'Amount Paid (EGP)'}</Label>
              <Input
                id="payAmount"
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">{isAr ? 'يمكنك إدخال أي مبلغ حتى لو كان الرصيد المستحق صفر' : 'You can enter any amount even if outstanding balance is 0'}</p>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label htmlFor="payMethod">{isAr ? 'طريقة الدفع' : 'Payment Method'}</Label>
              <select
                id="payMethod"
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="cash">{isAr ? 'نقداً (Cash)' : 'Cash'}</option>
                <option value="other">{isAr ? 'فودافون كاش / انستاباي (Mobile Wallet)' : 'Vodafone Cash / InstaPay'}</option>
                <option value="card">{isAr ? 'بطاقة بنكية (Credit/Debit Card)' : 'Credit/Debit Card'}</option>
                <option value="bank_transfer">{isAr ? 'تحويل بنكي (Bank Transfer)' : 'Bank Transfer'}</option>
              </select>
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <Label htmlFor="payRef">{isAr ? 'رقم الحوالة / المرجع (اختياري)' : 'Reference / Trans ID (Optional)'}</Label>
              <Input
                id="payRef"
                placeholder={isAr ? 'رقم عملية المحفظة أو الحوالة...' : 'Transaction reference...'}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" loading={loading}>
                {isAr ? 'تأكيد واستخراج الإيصال' : 'Record & Issue Receipt'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
