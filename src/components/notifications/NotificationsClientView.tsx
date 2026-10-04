'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Bell, CheckCheck, Trash2, Award, DollarSign, CalendarCheck,
  MessageSquare, FileText, ExternalLink, Clock, AlertCircle, Info, Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { markAllNotificationsReadAction, deleteNotificationAction } from '@/lib/notifications/actions'

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  readAt: string | null
  createdAt: string
}

interface Props {
  locale: string
  role: 'teacher' | 'student'
  notifications: NotificationItem[]
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'exam_published':
    case 'exam':
      return { icon: FileText, color: 'text-indigo-600 bg-indigo-500/10' }
    case 'results_published':
      return { icon: Award, color: 'text-amber-600 bg-amber-500/10' }
    case 'payment_recorded':
    case 'payment_reminder':
      return { icon: DollarSign, color: 'text-emerald-600 bg-emerald-500/10' }
    case 'attendance_marked':
    case 'attendance':
      return { icon: CalendarCheck, color: 'text-blue-600 bg-blue-500/10' }
    case 'chat_message':
      return { icon: MessageSquare, color: 'text-purple-600 bg-purple-500/10' }
    default:
      return { icon: Bell, color: 'text-primary bg-primary/10' }
  }
}

export function NotificationsClientView({ locale, role, notifications: initialItems }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isPending, startTransition] = useTransition()

  const unreadCount = useMemo(
    () => initialItems.filter((n) => !n.readAt).length,
    [initialItems]
  )

  const filtered = useMemo(() => {
    if (filter === 'unread') return initialItems.filter((n) => !n.readAt)
    return initialItems
  }, [initialItems, filter])

  function handleMarkAllRead() {
    startTransition(async () => {
      const res = await markAllNotificationsReadAction()
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isAr ? 'تم تعليم كافة الإشعارات كمقروءة' : 'All notifications marked as read')
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteNotificationAction(id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isAr ? 'تم حذف الإشعار' : 'Notification deleted')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-primary" />
            <span>{isAr ? 'مركز الإشعارات' : 'Notifications Center'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? isAr
                ? `لديك ${unreadCount} إشعار غير مقروء`
                : `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : isAr
              ? 'كافة الإشعارات مقروءة'
              : 'All notifications are up to date'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors shadow-sm shrink-0"
          >
            <CheckCheck className="h-4 w-4 text-primary" />
            <span>{isAr ? 'تعليم الكل كمقروء' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* ── Filter Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'border-border bg-background hover:bg-muted text-muted-foreground'
          }`}
        >
          {isAr ? 'الكل' : 'All'} ({initialItems.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            filter === 'unread'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'border-border bg-background hover:bg-muted text-muted-foreground'
          }`}
        >
          {isAr ? 'غير المقروءة' : 'Unread'} ({unreadCount})
        </button>
      </div>

      {/* ── Notifications List ────────────────────────────────────────── */}
      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
              <p className="font-bold text-base text-foreground">
                {filter === 'unread'
                  ? isAr ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications'
                  : isAr ? 'سجل الإشعارات فارغ' : 'No notifications yet'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isAr
                  ? 'ستصلك هنا إشعارات فورية عند نشر امتحانات جديدة، تسجيل درجات، أو إيصالات دفع.'
                  : 'You will receive instant alerts here when exams are posted, grades are ready, or payments are processed.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((item) => {
                const { icon: Icon, color } = getNotificationIcon(item.type)
                const isUnread = !item.readAt

                return (
                  <div
                    key={item.id}
                    className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                      isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground truncate">{item.title}</p>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>

                        {item.body && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.body}
                          </p>
                        )}

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {item.link && (
                            <Link
                              href={item.link}
                              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                            >
                              <span>{isAr ? 'عرض التفاصيل' : 'View'}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
