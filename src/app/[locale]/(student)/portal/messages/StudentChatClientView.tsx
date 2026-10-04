'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Send, User, GraduationCap, CheckCheck, Clock, MessageSquare,
  Sparkles, HelpCircle, AlertCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sendMessageAction, markMessagesReadAction, ChatMessage } from '@/lib/messages/actions'

interface Props {
  locale: string
  studentId: string
  studentName: string
  teacherName: string
  initialMessages: ChatMessage[]
}

const QUICK_TEMPLATES: { en: string; ar: string }[] = [
  { en: 'I have a question about the next exam', ar: 'عندي استفسار بخصوص الامتحان القادم' },
  { en: 'Requesting permission/excuse for missing a session', ar: 'طلب إذن غياب عن حصة دراسية' },
  { en: 'I need clarification on the homework assignment', ar: 'عندي سؤال في الواجب المنزلي' },
  { en: 'Inquiry regarding payment or monthly tuition', ar: 'استفسار بخصوص المصروفات الدراسية' },
]

export function StudentChatClientView({
  locale,
  studentId,
  studentName,
  teacherName,
  initialMessages,
}: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on initial load and message updates
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark unread teacher messages as read
  useEffect(() => {
    markMessagesReadAction(studentId, studentId)
  }, [studentId])

  function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim()
    if (!text || isPending) return

    // Optimistic message
    const tempMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      senderId: studentId,
      senderRole: 'student',
      senderName: studentName,
      studentId: studentId,
      body: text,
      readAt: null,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, tempMsg])
    if (!textToSend) setInput('')

    startTransition(async () => {
      const res = await sendMessageAction({
        studentId,
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
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-2xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Chat Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3.5 bg-background border border-border rounded-t-2xl shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base">{teacherName}</h2>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                {isAr ? 'معلم الأكاديمية' : 'Academy Teacher'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAr ? 'متاح للرد على استفساراتك' : 'Available for inquiries'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Messages Container ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 border-x border-border scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-sm">{isAr ? 'لا توجد رسائل سابقة' : 'No messages yet'}</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                {isAr
                  ? 'يمكنك توجيه أي سؤال أو استفسار للمعلم مباشرة وسيصلك الرد هنا.'
                  : 'Send any question or inquiry to your teacher directly and receive answers here.'}
              </p>
            </div>

            {/* Quick Suggestions */}
            <div className="w-full pt-4 space-y-1.5 max-w-sm">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                {isAr ? 'استفسارات شائعة:' : 'Quick Questions:'}
              </p>
              {QUICK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(isAr ? tmpl.ar : tmpl.en)}
                  className="w-full text-start text-xs p-2.5 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors truncate"
                >
                  {isAr ? tmpl.ar : tmpl.en}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === 'student'

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-sm text-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-background border border-border text-foreground rounded-bl-none'
                  }`}
                >
                  {!isMe && (
                    <p className="text-[11px] font-bold text-primary mb-1">
                      {msg.senderName}
                    </p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>

                  <div
                    className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${
                      isMe ? 'text-primary-foreground/75' : 'text-muted-foreground'
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
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

      {/* ── Chat Input ─────────────────────────────────────────────── */}
      <div className="p-3 bg-background border border-border rounded-b-2xl shadow-sm shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? 'اكتب رسالتك للمعلم...' : 'Type a message to your teacher...'}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl border border-input bg-transparent px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <button
            type="submit"
            disabled={!input.trim() || isPending}
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
  )
}
