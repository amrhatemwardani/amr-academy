import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const examId = request.nextUrl.searchParams.get('examId')
  if (!examId) return NextResponse.json({ error: 'examId required' }, { status: 400 })

  const admin = await createAdminClient()

  // Fetch all attempts for this exam with results and student info
  const { data: rawAttempts, error } = await (admin.from('exam_attempts' as any) as any)
    .select(`
      id, status, submitted_at,
      students (
        student_code,
        profiles ( full_name )
      ),
      exam_results ( score, total, percentage, passed, fully_graded )
    `)
    .eq('exam_id', examId)
    .order('submitted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const attempts = ((rawAttempts as any[]) || []).map((a: any) => {
    const result = a.exam_results
    return {
      id: a.id,
      status: a.status,
      submitted_at: a.submitted_at,
      student_name: a.students?.profiles?.full_name || 'Student',
      student_code: a.students?.student_code || '',
      score: result ? parseFloat(result.score) : null,
      total: result ? parseFloat(result.total) : null,
      percentage: result ? parseFloat(result.percentage) : null,
      passed: result?.passed ?? null,
      fully_graded: result?.fully_graded ?? false,
    }
  })

  return NextResponse.json({ attempts })
}
