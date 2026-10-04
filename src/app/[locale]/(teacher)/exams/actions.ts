'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Create Question ─────────────────────────────────────────────────
export async function createQuestionAction(data: {
  type: 'mcq' | 'true_false' | 'short_answer' | 'essay'
  body: string
  explanation?: string
  default_marks: number
  subject?: string
  tags?: string[]
  options?: { body: string; is_correct: boolean }[]
  accepted_answers?: string[]
  model_answer?: string
}) {
  const admin = createAdminClient()
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Insert question
  const { data: q, error: qErr } = await (admin.from('questions' as any) as any)
    .insert({
      type: data.type,
      body: data.body.trim(),
      explanation: data.explanation?.trim() || null,
      default_marks: data.default_marks,
      subject: data.subject?.trim() || null,
      tags: data.tags || [],
      created_by: user.id,
    })
    .select('id')
    .single()

  if (qErr) return { error: qErr.message }
  const questionId = q.id

  // Insert options (MCQ / True-False)
  if (data.options && data.options.length > 0) {
    const optionRows = data.options.map((o, i) => ({
      question_id: questionId,
      body: o.body.trim(),
      position: i + 1,
    }))
    const { data: insertedOpts, error: optErr } = await (admin.from('question_options' as any) as any)
      .insert(optionRows)
      .select('id, position')

    if (optErr) return { error: optErr.message }

    // Insert option keys
    const keyRows = (insertedOpts as any[]).map((opt: any, i: number) => ({
      option_id: opt.id,
      is_correct: data.options![i].is_correct,
    }))
    await (admin.from('option_keys' as any) as any).insert(keyRows)
  }

  // Insert question keys (short_answer / essay)
  if (data.accepted_answers?.length || data.model_answer) {
    await (admin.from('question_keys' as any) as any).insert({
      question_id: questionId,
      accepted_answers: data.accepted_answers || [],
      model_answer: data.model_answer || null,
    })
  }

  revalidatePath('/en/question-bank')
  revalidatePath('/ar/question-bank')
  return { success: true, id: questionId }
}

// ─── Update Question ─────────────────────────────────────────────────
export async function updateQuestionAction(
  questionId: string,
  data: Parameters<typeof createQuestionAction>[0],
) {
  const admin = createAdminClient()

  // Check if locked
  const { data: existing } = await (admin.from('questions' as any) as any)
    .select('is_locked')
    .eq('id', questionId)
    .single()

  if ((existing as any)?.is_locked) {
    return { error: 'This question is used in a published exam and cannot be edited. Clone it instead.' }
  }

  const { error: qErr } = await (admin.from('questions' as any) as any)
    .update({
      type: data.type,
      body: data.body.trim(),
      explanation: data.explanation?.trim() || null,
      default_marks: data.default_marks,
      subject: data.subject?.trim() || null,
      tags: data.tags || [],
    })
    .eq('id', questionId)

  if (qErr) return { error: qErr.message }

  // Replace options
  if (data.options && data.options.length > 0) {
    await (admin.from('question_options' as any) as any).delete().eq('question_id', questionId)
    const optionRows = data.options.map((o, i) => ({
      question_id: questionId,
      body: o.body.trim(),
      position: i + 1,
    }))
    const { data: insertedOpts, error: optErr } = await (admin.from('question_options' as any) as any)
      .insert(optionRows)
      .select('id, position')
    if (optErr) return { error: optErr.message }

    const keyRows = (insertedOpts as any[]).map((opt: any, i: number) => ({
      option_id: opt.id,
      is_correct: data.options![i].is_correct,
    }))
    await (admin.from('option_keys' as any) as any).insert(keyRows)
  }

  // Replace keys
  await (admin.from('question_keys' as any) as any).delete().eq('question_id', questionId)
  if (data.accepted_answers?.length || data.model_answer) {
    await (admin.from('question_keys' as any) as any).insert({
      question_id: questionId,
      accepted_answers: data.accepted_answers || [],
      model_answer: data.model_answer || null,
    })
  }

  revalidatePath('/en/question-bank')
  revalidatePath('/ar/question-bank')
  return { success: true }
}

// ─── Delete Question ─────────────────────────────────────────────────
export async function deleteQuestionAction(questionId: string) {
  const admin = createAdminClient()
  const { data: existing } = await (admin.from('questions' as any) as any)
    .select('is_locked')
    .eq('id', questionId)
    .single()

  if ((existing as any)?.is_locked) {
    return { error: 'Cannot delete a question that is used in a published exam.' }
  }

  const { error } = await (admin.from('questions' as any) as any)
    .delete()
    .eq('id', questionId)

  if (error) return { error: error.message }

  revalidatePath('/en/question-bank')
  revalidatePath('/ar/question-bank')
  return { success: true }
}

// ─── Create Exam ─────────────────────────────────────────────────────
export async function createExamAction(data: {
  class_id: string
  title: string
  description?: string
  instructions?: string
  duration_minutes: number
  start_at: string
  end_at: string
  pass_marks: number
  shuffle_questions: boolean
  shuffle_options: boolean
  questions: { question_id: string; position: number; marks: number }[]
}) {
  const admin = createAdminClient()
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!data.title?.trim()) return { error: 'Title is required' }
  if (data.questions.length === 0) return { error: 'Add at least one question' }
  if (new Date(data.end_at) <= new Date(data.start_at)) return { error: 'End time must be after start time' }

  const { data: exam, error: examErr } = await (admin.from('exams' as any) as any)
    .insert({
      class_id: data.class_id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      instructions: data.instructions?.trim() || null,
      duration_minutes: data.duration_minutes,
      start_at: data.start_at,
      end_at: data.end_at,
      pass_marks: data.pass_marks,
      shuffle_questions: data.shuffle_questions,
      shuffle_options: data.shuffle_options,
      status: 'draft',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (examErr) return { error: examErr.message }
  const examId = (exam as any).id

  // Insert exam questions
  const eqRows = data.questions.map((q) => ({
    exam_id: examId,
    question_id: q.question_id,
    position: q.position,
    marks: q.marks,
  }))
  const { error: eqErr } = await (admin.from('exam_questions' as any) as any).insert(eqRows)
  if (eqErr) return { error: eqErr.message }

  revalidatePath('/en/exams')
  revalidatePath('/ar/exams')
  return { success: true, id: examId }
}

// ─── Update Exam (draft only) ────────────────────────────────────────
export async function updateExamAction(
  examId: string,
  data: Omit<Parameters<typeof createExamAction>[0], 'class_id'> & { class_id?: string },
) {
  const admin = createAdminClient()

  const { data: existing } = await (admin.from('exams' as any) as any)
    .select('status')
    .eq('id', examId)
    .single()

  if ((existing as any)?.status === 'published') {
    return { error: 'Cannot edit a published exam. Close it first.' }
  }

  const { error: examErr } = await (admin.from('exams' as any) as any)
    .update({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      instructions: data.instructions?.trim() || null,
      duration_minutes: data.duration_minutes,
      start_at: data.start_at,
      end_at: data.end_at,
      pass_marks: data.pass_marks,
      shuffle_questions: data.shuffle_questions,
      shuffle_options: data.shuffle_options,
    })
    .eq('id', examId)

  if (examErr) return { error: examErr.message }

  // Replace questions
  await (admin.from('exam_questions' as any) as any).delete().eq('exam_id', examId)
  if (data.questions.length > 0) {
    const eqRows = data.questions.map((q) => ({
      exam_id: examId,
      question_id: q.question_id,
      position: q.position,
      marks: q.marks,
    }))
    await (admin.from('exam_questions' as any) as any).insert(eqRows)
  }

  revalidatePath('/en/exams')
  revalidatePath('/ar/exams')
  return { success: true }
}

// ─── Publish Exam ────────────────────────────────────────────────────
export async function publishExamAction(examId: string) {
  const admin = createAdminClient()
  const { error } = await (admin.from('exams' as any) as any)
    .update({ status: 'published' })
    .eq('id', examId)
    .eq('status', 'draft')

  if (error) return { error: error.message }

  // Lock all questions used in this exam
  const { data: eqs } = await (admin.from('exam_questions' as any) as any)
    .select('question_id')
    .eq('exam_id', examId)

  if (eqs && (eqs as any[]).length > 0) {
    const qIds = (eqs as any[]).map((eq: any) => eq.question_id)
    await (admin.from('questions' as any) as any)
      .update({ is_locked: true })
      .in('id', qIds)
  }

  revalidatePath('/en/exams')
  revalidatePath('/ar/exams')
  return { success: true }
}

// ─── Close Exam ──────────────────────────────────────────────────────
export async function closeExamAction(examId: string) {
  const admin = createAdminClient()
  const { error } = await (admin.from('exams' as any) as any)
    .update({ status: 'closed' })
    .eq('id', examId)

  if (error) return { error: error.message }

  revalidatePath('/en/exams')
  revalidatePath('/ar/exams')
  return { success: true }
}

// ─── Delete Exam (draft only) ────────────────────────────────────────
export async function deleteExamAction(examId: string) {
  const admin = createAdminClient()
  const { data: existing } = await (admin.from('exams' as any) as any)
    .select('status')
    .eq('id', examId)
    .single()

  if ((existing as any)?.status === 'published') {
    return { error: 'Cannot delete a published exam. Close it first.' }
  }

  const { error } = await (admin.from('exams' as any) as any)
    .delete()
    .eq('id', examId)

  if (error) return { error: error.message }

  revalidatePath('/en/exams')
  revalidatePath('/ar/exams')
  return { success: true }
}

// ─── Publish Results ─────────────────────────────────────────────────
export async function publishResultsAction(examId: string) {
  const client = await createClient()
  const { data, error } = await (client.rpc as any)('publish_results', { p_exam_id: examId })
  if (error) return { error: error.message }
  revalidatePath('/en/exams')
  revalidatePath('/ar/exams')
  return { success: true, count: data }
}

// ─── Grade Answer ────────────────────────────────────────────────────
export async function gradeAnswerAction(attemptId: string, questionId: string, marks: number, feedback?: string) {
  const client = await createClient()
  const { error } = await (client.rpc as any)('grade_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_marks: marks,
    p_feedback: feedback || null,
  })
  if (error) return { error: error.message }
  return { success: true }
}
