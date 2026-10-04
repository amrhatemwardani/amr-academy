'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startAttemptAction(examId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase.rpc as any)('start_attempt', {
    p_exam_id: examId,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, data }
}

export async function getAttemptQuestionsAction(attemptId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase.rpc as any)('get_attempt_questions', {
    p_attempt_id: attemptId,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, questions: data || [] }
}

export async function saveAnswersAction(
  attemptId: string,
  answers: {
    question_id: string
    selected_option_id?: string | null
    text_answer?: string | null
  }[],
) {
  const supabase = await createClient()

  const { data, error } = await (supabase.rpc as any)('save_answers', {
    p_attempt_id: attemptId,
    p_answers: answers,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, data }
}

export async function submitAttemptAction(attemptId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase.rpc as any)('submit_attempt', {
    p_attempt_id: attemptId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/en/portal/exams')
  revalidatePath('/ar/portal/exams')

  return { success: true, data }
}
