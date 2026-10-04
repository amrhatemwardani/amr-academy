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

  const admin = await createAdminClient()

  // Fetch questions with options and keys
  const { data: rawQuestions } = await (admin.from('questions' as any) as any)
    .select(`
      id, type, body, explanation, default_marks, subject, tags, is_locked,
      question_options ( id, body, position ),
      question_keys ( accepted_answers, model_answer ),
      option_keys ( option_id, is_correct )
    `)
    .order('created_at', { ascending: false })

  const questions = ((rawQuestions as any[]) || []).map((q: any) => {
    const optionKeyMap: Record<string, boolean> = {}
    ;(q.option_keys || []).forEach((ok: any) => {
      optionKeyMap[ok.option_id] = ok.is_correct
    })
    return {
      id: q.id,
      type: q.type,
      body: q.body,
      explanation: q.explanation,
      default_marks: parseFloat(q.default_marks) || 1,
      subject: q.subject,
      tags: q.tags || [],
      is_locked: q.is_locked,
      options: (q.question_options || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((o: any) => ({
          id: o.id,
          body: o.body,
          is_correct: optionKeyMap[o.id] ?? false,
        })),
      accepted_answers: q.question_keys?.accepted_answers || [],
      model_answer: q.question_keys?.model_answer || '',
    }
  })

  return (
    <QuestionBankClientView
      locale={locale}
      questions={questions}
    />
  )
}
