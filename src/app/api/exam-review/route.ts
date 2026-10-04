import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const attemptId = request.nextUrl.searchParams.get('attemptId')
  if (!attemptId) return NextResponse.json({ error: 'attemptId required' }, { status: 400 })

  const supabase = await createClient()

  // Use get_exam_review RPC — it handles auth and gating
  const { data, error } = await (supabase.rpc as any)('get_exam_review', { p_attempt_id: attemptId })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ questions: data || [] })
}
