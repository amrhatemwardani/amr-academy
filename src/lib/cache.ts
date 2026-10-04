import { revalidateTag as nextRevalidateTag } from 'next/cache'

/**
 * Cache tags used for tag-based revalidation.
 *
 * Usage in data fetching:
 *   unstable_cache(fn, [key], { tags: [TAGS.dashboard] })
 *
 * Usage in Server Actions after writes:
 *   revalidate(TAGS.dashboard)
 */
export const TAGS = {
  // Dashboard aggregates (revalidated on most writes)
  dashboard: 'dashboard',

  // Student data
  students: 'students',
  student: (id: string) => `student:${id}`,

  // Class and enrollment data
  classes: 'classes',
  class: (id: string) => `class:${id}`,
  enrollments: (classId: string) => `enrollments:${classId}`,

  // Attendance
  attendance: 'attendance',
  attendanceClass: (classId: string) => `attendance:class:${classId}`,
  attendanceStudent: (studentId: string) => `attendance:student:${studentId}`,

  // Finance
  charges: (studentId: string) => `charges:${studentId}`,
  payments: (studentId: string) => `payments:${studentId}`,
  balances: 'balances',

  // Exams
  exams: 'exams',
  exam: (id: string) => `exam:${id}`,
  examResults: (examId: string) => `exam-results:${examId}`,

  // Notifications
  notifications: (userId: string) => `notifications:${userId}`,

  // Settings
  settings: 'settings',
} as const

/**
 * Revalidates one or more cache tags.
 * Call this from Server Actions after writes.
 */
export function revalidate(...tags: string[]) {
  tags.forEach(tag => nextRevalidateTag(tag))
}
