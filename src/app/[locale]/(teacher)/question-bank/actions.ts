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
