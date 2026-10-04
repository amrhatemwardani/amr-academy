'use client'

import { useState } from 'react'
import { Bell, CheckCheck, Clock, CreditCard, FileText, CalendarCheck, ExternalLink, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { markAllNotificationsReadAction } from './actions'
import { toast } from 'sonner'
import Link from 'next/link'

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read_at: string | null
  created_at: string
}

interface Props {
  locale: string
  initialNotifications: NotificationItem[]
}

const TYPE_ICONS: Record<string, any> = {
  payment_due: CreditCard,
  payment_recorded: CreditCard,
  exam_upcoming: FileText,
  exam_published: FileText,
  attendance_absent: CalendarCheck,
  attendance_warning: CalendarCheck,
  general: Bell,
}

export function NotificationsClient({ locale, initialNotifications }: Props) {
  const isAr = locale === 'ar'
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [marking, setMarking] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const handleMarkAllRead = async () => {
    setMarking(true)
    const res = await markAllNotificationsReadAction(locale)
    setMarking(false)
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      )
      toast.success(isAr ? 'تم تحديد كل الإشعارات كمقروءة' : 'All notifications marked as read')
    } else {
      toast.error(res.error || 'Failed')
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-5 w-5 text-indigo-200" />
              <span className="text-xs font-semibold text-indigo-200">
                {isAr ? 'مركز التنبيهات' : 'Notification Center'}
              </span>
            </div>
            <h1 className="text-2xl font-bold">
              {isAr ? 'الإشعارات والتنبيهات' : 'Notifications & Alerts'}
            </h1>
            <p className="text-xs text-indigo-100/90 mt-1">
              {isAr
                ? 'تابع كل ما يخص الحصص، الامتحانات، الواجبات والمدفوعات أولاً بأول'
                : 'Stay updated with your classes, exams, assignments, and payments'}
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              disabled={marking}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1.5 shrink-0"
            >
              <CheckCheck className="h-4 w-4" />
              <span>{isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <Bell className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">
              {isAr ? 'لا توجد إشعارات جديدة حالياً' : 'No notifications yet'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {isAr
                ? 'أي إشعارات جديدة بخصوص الدروس والامتحانات والواجبات ستظهر لك هنا مباشرة.'
                : 'Any announcements, exams, or homework updates will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => {
            const Icon = TYPE_ICONS[item.type] || Bell
            const isUnread = !item.read_at

            return (
              <div
                key={item.id}
                className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all ${
                  isUnread
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-card border-border hover:bg-muted/30'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnread
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold truncate ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                      {item.title}
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                    {item.body}
                  </p>

                  {item.link && (
                    <div className="mt-2">
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <span>{isAr ? 'عرض التفاصيل' : 'View details'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
