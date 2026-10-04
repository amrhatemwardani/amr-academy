'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import {
  BookOpen,
  Users,
  CalendarCheck,
  Clock,
  CreditCard,
  Calendar,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { AddClassDialog } from './AddClassDialog'
import { deleteClassAction, updateClassAction } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface ClassCardItem {
  id: string
  name: string
  subject: string
  level: string
  is_active: boolean
  schedule: Array<{ dow: number; start: string; end: string }>
  monthlyFee: number
  enrolledCount: number
}

interface ClassesClientViewProps {
  classes: ClassCardItem[]
}

const DOW_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DOW_NAMES_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export function ClassesClientView({ classes }: ClassesClientViewProps) {
  const locale = useLocale()
  const router = useRouter()
  const isAr = locale === 'ar'

  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleActive = async (c: ClassCardItem) => {
    try {
      setLoadingId(c.id)
      const res = await updateClassAction(
        c.id,
        {
          name: c.name,
          subject: c.subject,
          level: c.level,
          isActive: !c.is_active,
        },
        locale
      )
      if (res.success) {
        toast.success(
          c.is_active
            ? isAr ? 'تم إلغاء تفعيل الفصل' : 'Class deactivated'
            : isAr ? 'تم تفعيل الفصل بنجاح' : 'Class activated'
        )
        router.refresh()
      } else {
        toast.error('Update failed')
      }
    } catch {
      toast.error('Error')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (classId: string) => {
    try {
      setLoadingId(classId)
      const res = await deleteClassAction(classId, locale)
      if (res.success) {
        if (res.deactivated) {
          toast.info(isAr ? 'تم إلغاء تفعيل الفصل لوجود طلاب مسجلين' : res.message)
        } else {
          toast.success(isAr ? 'تم حذف الفصل بنجاح' : 'Class deleted successfully')
        }
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete class')
      }
    } catch {
      toast.error('Delete error')
    } finally {
      setLoadingId(null)
    }
  }

  const formatSchedule = (schedule: Array<{ dow: number; start: string; end: string }>) => {
    if (!schedule || schedule.length === 0) return isAr ? 'لا يوجد جدول محدد' : 'No schedule set'
    const days = schedule
      .map((s) => (isAr ? DOW_NAMES_AR[s.dow] : DOW_NAMES_EN[s.dow]))
      .join(', ')
    const times = schedule[0] ? `${schedule[0].start} - ${schedule[0].end}` : ''
    return `${days} (${times})`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>{isAr ? 'الفصول الدراسية' : 'Class Management'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr
              ? `إجمالي ${classes.length} فصل دراسي مسجل في الأكاديمية`
              : `Total ${classes.length} academic classes in Amr Academy`}
          </p>
        </div>

        <AddClassDialog onSuccess={() => router.refresh()} />
      </div>

      {/* Grid of Classes */}
      {classes.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-base font-semibold">{isAr ? 'لا توجد فصول دراسية بعد' : 'No classes found'}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {isAr ? 'ابدأ بإنشاء أول فصل دراسي لإضافة الطلاب والبدء بتسجيل الحضور' : 'Create your first class to start enrolling students and taking attendance'}
          </p>
          <AddClassDialog onSuccess={() => router.refresh()} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <Card
              key={c.id}
              className={`flex flex-col justify-between transition-all hover:shadow-md border-border ${
                !c.is_active ? 'opacity-65 bg-muted/30' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="secondary" className="text-[10px] mb-1.5 font-normal">
                      {c.level}
                    </Badge>
                    <CardTitle className="text-lg font-bold">{c.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.subject}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleActive(c)}>
                        {c.is_active ? (
                          <span className="text-amber-600 flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            {isAr ? 'إلغاء التفعيل' : 'Deactivate'}
                          </span>
                        ) : (
                          <span className="text-emerald-600 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {isAr ? 'تفعيل الفصل' : 'Activate'}
                          </span>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleDelete(c.id)}
                        className="text-destructive gap-2"
                      >
                        {isAr ? 'حذف / أرشفة الفصل' : 'Delete / Archive Class'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/50 border border-border text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-bold text-foreground">{c.enrolledCount}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? 'طالب مسجل' : 'Students'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="font-bold text-foreground">{c.monthlyFee} EGP</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? 'شهرياً' : 'Monthly'}</p>
                    </div>
                  </div>
                </div>

                {/* Schedule info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                  <span className="truncate">{formatSchedule(c.schedule)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button variant="default" size="sm" className="flex-1 gap-1.5 text-xs" asChild>
                    <Link href={`/${locale}/attendance?classId=${c.id}`}>
                      <CalendarCheck className="h-3.5 w-3.5" />
                      <span>{isAr ? 'تسجيل الحضور' : 'Attendance'}</span>
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <Link href={`/${locale}/students?class=${c.id}`}>
                      <span>{isAr ? 'الطلاب' : 'Roster'}</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
