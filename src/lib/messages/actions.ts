'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ChatMessage {
  id: string
  senderId: string
  senderRole: 'student' | 'teacher'
  senderName: string
  studentId: string
  body: string
  readAt: string | null
  createdAt: string
}

export interface ConversationSummary {
  studentId: string
  studentCode: string
  studentName: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

// ── Send Message ──────────────────────────────────────────────────────
export async function sendMessageAction({
  studentId,
  content,
}: {
  studentId: string
  content: string
}) {
  const text = content?.trim()
  if (!text) return { error: 'Message cannot be empty.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = await createAdminClient()

  // Get current user profile
  const { data: profile } = await (admin.from('profiles' as any) as any)
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found.' }

  const senderRole: 'student' | 'teacher' = profile.role

  let recipientId = ''
  if (senderRole === 'student') {
    // Send to teacher: find teacher profile
    const { data: teacher } = await (admin.from('profiles' as any) as any)
      .select('id')
      .eq('role', 'teacher')
      .limit(1)
      .single()

    if (!teacher) return { error: 'Teacher not found.' }
    recipientId = teacher.id
  } else {
    // Teacher sending to student
    recipientId = studentId
  }

  const { data: inserted, error } = await (admin.from('notifications' as any) as any)
    .insert({
      user_id: recipientId,
      type: 'chat_message',
      title: profile.full_name,
      body: text,
      channel: 'in_app',
      metadata: {
        student_id: studentId,
        sender_id: user.id,
        sender_role: senderRole,
        sender_name: profile.full_name,
      },
    })
    .select('id, created_at')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/en/messages')
  revalidatePath('/ar/messages')
  revalidatePath('/en/portal/messages')
  revalidatePath('/ar/portal/messages')

  return { success: true, messageId: inserted.id }
}

// ── Get Messages for a Student ────────────────────────────────────────
export async function getStudentMessages(studentId: string): Promise<ChatMessage[]> {
  const admin = await createAdminClient()

  const { data, error } = await (admin.from('notifications' as any) as any)
    .select('id, user_id, title, body, read_at, metadata, created_at')
    .eq('type', 'chat_message')
    .filter('metadata->>student_id', 'eq', studentId)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((item: any) => ({
    id: item.id,
    senderId: item.metadata?.sender_id,
    senderRole: item.metadata?.sender_role || 'student',
    senderName: item.metadata?.sender_name || item.title,
    studentId: item.metadata?.student_id,
    body: item.body,
    readAt: item.read_at,
    createdAt: item.created_at,
  }))
}

// ── Mark Messages as Read ─────────────────────────────────────────────
export async function markMessagesReadAction(studentId: string, currentUserId: string) {
  const admin = await createAdminClient()

  await (admin.from('notifications' as any) as any)
    .update({ read_at: new Date().toISOString() })
    .eq('type', 'chat_message')
    .eq('user_id', currentUserId)
    .filter('metadata->>student_id', 'eq', studentId)
    .is('read_at', null)

  return { success: true }
}

// ── Get All Conversations for Teacher ─────────────────────────────────
export async function getTeacherConversations(): Promise<ConversationSummary[]> {
  const admin = await createAdminClient()

  // Get all chat messages
  const { data: messages } = await (admin.from('notifications' as any) as any)
    .select('id, user_id, read_at, body, metadata, created_at')
    .eq('type', 'chat_message')
    .order('created_at', { ascending: false })

  if (!messages || messages.length === 0) return []

  // Group by student_id
  const studentMap: Record<string, {
    lastMessage: string
    lastMessageAt: string
    unreadCount: number
  }> = {}

  messages.forEach((m: any) => {
    const sId = m.metadata?.student_id
    if (!sId) return

    if (!studentMap[sId]) {
      studentMap[sId] = {
        lastMessage: m.body,
        lastMessageAt: m.created_at,
        unreadCount: 0,
      }
    }

    // If message was sent by student and not read yet
    if (m.metadata?.sender_role === 'student' && !m.read_at) {
      studentMap[sId].unreadCount++
    }
  })

  const studentIds = Object.keys(studentMap)
  if (studentIds.length === 0) return []

  // Fetch student names & codes
  const { data: students } = await (admin.from('students' as any) as any)
    .select('id, student_code, profiles(full_name)')
    .in('id', studentIds)

  const studentDetailsMap: Record<string, { code: string; name: string }> = {}
  ;(students || []).forEach((s: any) => {
    studentDetailsMap[s.id] = {
      code: s.student_code || 'S0000',
      name: s.profiles?.full_name || 'Student',
    }
  })

  return studentIds.map((sId) => ({
    studentId: sId,
    studentCode: studentDetailsMap[sId]?.code || 'STUDENT',
    studentName: studentDetailsMap[sId]?.name || 'Student',
    lastMessage: studentMap[sId].lastMessage,
    lastMessageAt: studentMap[sId].lastMessageAt,
    unreadCount: studentMap[sId].unreadCount,
  }))
}
