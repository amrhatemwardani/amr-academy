'use server'

import {
  createQuestionAction as _createQuestionAction,
  updateQuestionAction as _updateQuestionAction,
  deleteQuestionAction as _deleteQuestionAction,
} from '../exams/actions'

export async function createQuestionAction(
  data: Parameters<typeof _createQuestionAction>[0]
) {
  return _createQuestionAction(data)
}

export async function updateQuestionAction(
  questionId: string,
  data: Parameters<typeof _updateQuestionAction>[1]
) {
  return _updateQuestionAction(questionId, data)
}

export async function deleteQuestionAction(questionId: string) {
  return _deleteQuestionAction(questionId)
}

export async function bulkImportQuestionsAction(
  questions: Array<Parameters<typeof _createQuestionAction>[0]>
) {
  let imported = 0
  let firstError: string | null = null

  for (const q of questions) {
    try {
      const res = await _createQuestionAction(q)
      if (res && 'success' in res && res.success) {
        imported++
      } else if (res && 'error' in res && !firstError) {
        firstError = res.error
      }
    } catch (e: any) {
      if (!firstError) firstError = e?.message || 'Import error'
    }
  }

  if (imported === 0 && firstError) {
    return { error: firstError }
  }

  return { success: true, count: imported }
}

