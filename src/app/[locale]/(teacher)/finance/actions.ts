'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface RecordPaymentInput {
  studentId: string
  amount: number
  method: 'cash' | 'card' | 'bank_transfer' | 'other'
  reference?: string | null
  notes?: string | null
}

export async function recordPaymentAction(input: RecordPaymentInput, locale = 'en') {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase.rpc as any)('record_payment', {
      p_student_id: input.studentId,
      p_amount: input.amount,
      p_method: input.method,
      p_paid_at: new Date().toISOString(),
      p_reference: input.reference || null,
      p_notes: input.notes || null,
      p_allocations: null, // Auto-allocate oldest first
      p_allow_credit: true,
    })

    if (error) {
      console.error('record_payment RPC error:', error)
      throw new Error(error.message)
    }

    revalidatePath(`/${locale}/finance`)
    revalidatePath(`/${locale}/dashboard`)
    return { success: true, receiptNo: data?.receipt_no, paymentId: data?.payment_id }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to record payment'
    return { success: false, error: msg }
  }
}

export async function voidPaymentAction(paymentId: string, reason: string, locale = 'en') {
  try {
    const supabase = await createClient()

    const { error } = await (supabase.rpc as any)('void_payment', {
      p_payment_id: paymentId,
      p_reason: reason || 'Voided by teacher',
    })

    if (error) throw new Error(error.message)

    revalidatePath(`/${locale}/finance`)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to void payment'
    return { success: false, error: msg }
  }
}

export async function generateMonthlyChargesAction(periodDate: string, locale = 'en') {
  try {
    const admin = createAdminClient()

    const { data: count, error } = await (admin.rpc as any)('generate_monthly_charges', {
      p_period: periodDate,
    })

    if (error) throw new Error(error.message)

    revalidatePath(`/${locale}/finance`)
    revalidatePath(`/${locale}/dashboard`)
    return { success: true, count: Number(count) || 0 }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate charges'
    return { success: false, error: msg }
  }
}
