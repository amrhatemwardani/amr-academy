import { requireTeacher } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { QuestionBankClientView } from './QuestionBankClientView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Question Bank' }

export default async function QuestionBankPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const admin = createAdminClient()

  // Fetch questions with options and keys (nested option_keys)
  const { data: rawQuestions, error: qError } = await (admin.from('questions' as any) as any)
    .select(`
      id, type, body, explanation, default_marks, subject, tags, is_locked, created_at,
      question_options ( id, body, position, option_keys ( is_correct ) ),
      question_keys ( accepted_answers, model_answer )
    `)
    .order('created_at', { ascending: false })

  if (qError) {
    console.error('Error fetching questions:', qError)
  }

  const questions = ((rawQuestions as any[]) || []).map((q: any) => {
    return {
      id: q.id,
      type: q.type,
      body: q.body,
      explanation: q.explanation,
      default_marks: parseFloat(q.default_marks) || 1,
      subject: q.subject || (q.tags?.includes('physics') ? 'Physics' : q.tags?.includes('math') ? 'Mathematics' : 'General'),
      tags: q.tags || [],
      is_locked: !!q.is_locked,
      created_at: q.created_at,
      options: (q.question_options || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((o: any) => {
          const isCorrect = Array.isArray(o.option_keys)
            ? o.option_keys[0]?.is_correct ?? false
            : o.option_keys?.is_correct ?? false
          return {
            id: o.id,
            body: o.body,
            is_correct: isCorrect,
          }
        }),
      accepted_answers: Array.isArray(q.question_keys)
        ? q.question_keys[0]?.accepted_answers || []
        : q.question_keys?.accepted_answers || [],
      model_answer: Array.isArray(q.question_keys)
        ? q.question_keys[0]?.model_answer || ''
        : q.question_keys?.model_answer || '',
    }
  })

  return (
    <QuestionBankClientView
      locale={locale}
      questions={questions}
    />
  )
}
