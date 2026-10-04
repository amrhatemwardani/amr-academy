'use client'

import { useState, useRef, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Send, User, Search, MessageSquare, CheckCheck, Clock, CheckCircle2,
  GraduationCap, Phone, Sparkles, Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  sendMessageAction,
  markMessagesReadAction,
  ChatMessage,
  ConversationSummary,
} from '@/lib/messages/actions'

interface Props {
  locale: string
  teacherId: string
  teacherName: string
  conversations: ConversationSummary[]
  allStudents: { id: string; code: string; name: string }[]
  initialMessagesMap: Record<string, ChatMessage[]>
}

export function TeacherMessagesClientView({
  locale,
  teacherId,
  teacherName,
  conversations,
  allStudents,
  initialMessagesMap,
}: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    conversations[0]?.studentId || allStudents[0]?.id || ''
  )
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(initialMessagesMap)
  const [search, setSearch] = useState('')
  const [replyText, setReplyText] = useState('')
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on active thread change or message arrival
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedStudentId, messagesMap])

  // Mark selected student's messages as read
  useEffect(() => {
    if (selectedStudentId) {
      markMessagesReadAction(selectedStudentId, teacherId)
    }
  }, [selectedStudentId, teacherId])

  // Filter students list
  const filteredList = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return conversations.length > 0 ? conversations : allStudents.map((st) => ({
      studentId: st.id,
      studentCode: st.code,
      studentName: st.name,
      lastMessage: '',
      lastMessageAt: '',
      unreadCount: 0,
    }))

    // Search across all students
    return allStudents
      .filter((st) => st.name.toLowerCase().includes(s) || st.code.toLowerCase().includes(s))
      .map((st) => {
        const conv = conversations.find((c) => c.studentId === st.id)
        return (
          conv || {
            studentId: st.id,
            studentCode: st.code,
            studentName: st.name,
            lastMessage: '',
            lastMessageAt: '',
            unreadCount: 0,
          }
        )
      })
  }, [conversations, allStudents, search])

  const selectedStudent = useMemo(() => {
    return allStudents.find((s) => s.id === selectedStudentId) || {
      id: selectedStudentId,
      code: 'STUDENT',
      name: 'Student',
    }
  }, [allStudents, selectedStudentId])

  const activeMessages = messagesMap[selectedStudentId] || []

  function handleSend(textToSend?: string) {
    const text = (textToSend || replyText).trim()
    if (!text || !selectedStudentId || isPending) return

    // Optimistic update
    const newMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      senderId: teacherId,
      senderRole: 'teacher',
      senderName: teacherName,
      studentId: selectedStudentId,
      body: text,
      readAt: null,
      createdAt: new Date().toISOString(),
    }

    setMessagesMap((prev) => ({
      ...prev,
      [selectedStudentId]: [...(prev[selectedStudentId] || []), newMsg],
    }))

    if (!textToSend) setReplyText('')

    startTransition(async () => {
      const res = await sendMessageAction({
        studentId: selectedStudentId,
        content: text,
      })

      if (res?.error) {
        toast.error(res.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          {isAr ? 'مركز رسائل الطلاب' : 'Student Messages'}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {isAr
            ? 'التواصل المباشر والرد على استفسارات الطلاب والواجبات'
            : 'Direct communication & answering student inquiries and questions'}
        </p>
      </div>

      {/* Two-Column Messenger */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-210px)] min-h-[500px]">
        {/* ── Left Pane: Conversations List ─────────────────────────── */}
        <div className="md:col-span-4 lg:col-span-4 flex flex-col rounded-xl border border-border bg-background overflow-hidden shadow-sm">
          {/* Search */}
          <div className="p-3 border-b border-border bg-muted/20">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم أو كود الطالب...' : 'Search student or code...'}
                className="w-full h-9 rounded-lg border border-input bg-background ps-9 pe-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Student Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border scrollbar-thin">
            {filteredList.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {isAr ? 'لا يوجد طلاب مطابقين للبحث' : 'No students found'}
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = item.studentId === selectedStudentId
                return (
                  <button
                    key={item.studentId}
                    onClick={() => setSelectedStudentId(item.studentId)}
                    className={`w-full flex items-start gap-3 p-3.5 text-start transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-s-4 border-s-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {item.studentName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-semibold text-xs truncate text-foreground">
                          {item.studentName}
                        </p>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {item.studentCode}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.lastMessage || (isAr ? 'انقر لبدء المحادثة...' : 'Click to start chat...')}
                      </p>
                    </div>

                    {item.unreadCount > 0 && (
                      <span className="h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                        {item.unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right Pane: Active Chat Conversation ──────────────────── */}
        <div className="md:col-span-8 lg:col-span-8 flex flex-col rounded-xl border border-border bg-background overflow-hidden shadow-sm">
          {/* Header of Active Student */}
          <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {selectedStudent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{selectedStudent.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{selectedStudent.code}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-medium">
                    {isAr ? 'حساب نشط' : 'Active Account'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10 scrollbar-thin">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                <MessageSquare className="h-8 w-8 opacity-30 mx-auto" />
                <p className="text-xs font-medium">
                  {isAr ? 'لا توجد رسائل مع هذا الطالب بعد' : 'No message history with this student'}
                </p>
                <p className="text-[11px]">
                  {isAr ? 'اكتب رسالة أدناه لبدء المحادثة معه.' : 'Type a reply below to initiate conversation.'}
                </p>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isTeacher = msg.senderRole === 'teacher'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm text-sm ${
                        isTeacher
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-background border border-border text-foreground rounded-bl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          isTeacher ? 'text-primary-foreground/75' : 'text-muted-foreground'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isTeacher && (
                          <CheckCheck className={`h-3 w-3 ${msg.readAt ? 'text-emerald-300' : 'opacity-70'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={scrollRef} />
          </div>

          {/* Quick Replies & Input */}
          <div className="p-3 border-t border-border bg-background space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                {isAr ? 'رد سريع:' : 'Quick:'}
              </span>
              {[
                { en: 'Received and noted, thank you.', ar: 'تم الاستلام وجاري المتابعة، شكراً لك.' },
                { en: 'Please attend the upcoming session on time.', ar: 'يرجى الالتزام بموعد الحصة القادمة في موعدها.' },
                { en: 'Well done on your recent exam!', ar: 'أحسنت في الامتحان الأخير، أداء ممتاز!' },
              ].map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(isAr ? qr.ar : qr.en)}
                  className="shrink-0 px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isAr ? qr.ar : qr.en}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAr ? `الرد على ${selectedStudent.name}...` : `Reply to ${selectedStudent.name}...`}
                disabled={isPending || !selectedStudentId}
                className="flex-1 h-10 rounded-xl border border-input bg-transparent px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              <button
                type="submit"
                disabled={!replyText.trim() || isPending || !selectedStudentId}
                className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 shrink-0"
              >
                {isPending ? (
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
