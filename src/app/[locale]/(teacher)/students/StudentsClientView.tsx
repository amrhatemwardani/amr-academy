'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import {
  Search,
  Download,
  Users,
  Phone,
  MoreVertical,
  Edit,
  Eye,
  Copy,
  Check,
  MessageSquare,
  GraduationCap,
  Trash2,
  UserCheck,
  UserX,
  Archive,
  ChevronDown,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { AddStudentDialog } from './AddStudentDialog'
import { EditStudentDialog } from './EditStudentDialog'
import { ImportCSVDialog } from './ImportCSVDialog'
import {
  updateStudentStatusAction,
  deleteStudentAction,
  deleteMultipleStudentsAction,
} from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface StudentListItem {
  id: string
  student_code: string
  full_name: string
  phone: string | null
  parent_phone: string | null
  email: string | null
  status: 'active' | 'inactive' | 'archived'
  enrolled_on: string
  classes: Array<{ id: string; name: string }>
}

interface StudentsClientViewProps {
  initialStudents: StudentListItem[]
  classes: Array<{ id: string; name: string }>
}

export function StudentsClientView({ initialStudents, classes }: StudentsClientViewProps) {
  const locale = useLocale()
  const router = useRouter()
  const isAr = locale === 'ar'

  // Filters
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Edit dialog state
  const [editingStudent, setEditingStudent] = useState<StudentListItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Single delete dialog state
  const [studentToDelete, setStudentToDelete] = useState<StudentListItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Bulk delete dialog state
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // WhatsApp Broadcast state
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState(
    isAr
      ? 'مرحباً، إشعار هام من أستاذ عمرو حاتم بخصوص الحصص والواجبات:'
      : 'Hello, important notice from Eng. Amr Hatem regarding classes and assignments:'
  )
  const [broadcastTarget, setBroadcastTarget] = useState<'parent' | 'student'>('parent')

  const formatPhoneForWA = (phone: string | null) => {
    if (!phone) return ''
    let p = phone.replace(/[^0-9]/g, '')
    if (p.startsWith('0')) p = '2' + p
    return p
  }

  // Filtered students
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((s) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.student_code.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.parent_phone && s.parent_phone.includes(q))

      const matchesClass =
        selectedClass === 'all' || s.classes.some((c) => c.id === selectedClass)

      const matchesStatus =
        selectedStatus === 'all' || s.status === selectedStatus

      return matchesSearch && matchesClass && matchesStatus
    })
  }, [initialStudents, search, selectedClass, selectedStatus])

  // Select all visible toggle
  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.has(s.id))

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      const next = new Set(selectedIds)
      filteredStudents.forEach((s) => next.add(s.id))
      setSelectedIds(next)
    }
  }

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Quick single status toggle
  const handleQuickStatusChange = async (studentId: string, status: 'active' | 'inactive' | 'archived') => {
    try {
      const res = await updateStudentStatusAction(studentId, status, locale)
      if (res.success) {
        toast.success(
          status === 'active'
            ? isAr ? 'تم تفعيل الحساب' : 'Account activated'
            : status === 'inactive'
            ? isAr ? 'تم تعليق الحساب (تم حظر الدخول)' : 'Account suspended (login blocked)'
            : isAr ? 'تمت أرشفة الحساب' : 'Account archived'
        )
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to update status')
      }
    } catch {
      toast.error('Error updating status')
    }
  }

  // Bulk status change
  const handleBulkStatusChange = async (status: 'active' | 'inactive' | 'archived') => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    setBulkLoading(true)
    try {
      let count = 0
      for (const id of ids) {
        const res = await updateStudentStatusAction(id, status, locale)
        if (res.success) count++
      }
      toast.success(
        isAr
          ? `تم تحديث حالة ${count} طالب بنجاح`
          : `Updated status for ${count} students`
      )
      setSelectedIds(new Set())
      router.refresh()
    } catch {
      toast.error('Bulk update error')
    } finally {
      setBulkLoading(false)
    }
  }

  // Single delete
  const handleConfirmSingleDelete = async () => {
    if (!studentToDelete) return
    setDeleteLoading(true)
    try {
      const res = await deleteStudentAction(studentToDelete.id, locale)
      if (res.success) {
        toast.success(isAr ? 'تم حذف حساب الطالب نهائياً' : 'Student account permanently deleted')
        const next = new Set(selectedIds)
        next.delete(studentToDelete.id)
        setSelectedIds(next)
        setStudentToDelete(null)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete student')
      }
    } catch {
      toast.error('Delete error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Bulk delete
  const handleConfirmBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    setBulkLoading(true)
    try {
      const res = await deleteMultipleStudentsAction(ids, locale)
      if (res.success) {
        toast.success(
          isAr
            ? `تم حذف ${res.count} حساب طالب نهائياً`
            : `Successfully deleted ${res.count} student accounts`
        )
        setSelectedIds(new Set())
        setBulkDeleteOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete selected accounts')
      }
    } catch {
      toast.error('Error during bulk deletion')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(isAr ? 'تم نسخ كود الطالب' : 'Student code copied')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleExportCSV = () => {
    const headers = ['Student Code', 'Full Name', 'Phone', 'Parent Phone', 'Classes', 'Status', 'Enrolled On']
    const rows = filteredStudents.map((s) => [
      s.student_code,
      `"${s.full_name.replace(/"/g, '""')}"`,
      s.phone || '',
      s.parent_phone || '',
      `"${s.classes.map((c) => c.name).join(', ')}"`,
      s.status,
      s.enrolled_on,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span>{isAr ? 'إدارة الطلاب' : 'Students Management'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr
              ? `إجمالي ${initialStudents.length} طالب مسجل في الأكاديمية`
              : `Total ${initialStudents.length} students enrolled in Amr Academy`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            <span>{isAr ? 'تصدير' : 'Export'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setBroadcastOpen(true)}
            className="gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
          >
            <Phone className="h-4 w-4 text-emerald-600" />
            <span>{isAr ? 'رسالة واتساب جماعية' : 'WhatsApp Broadcast'}</span>
          </Button>

          <ImportCSVDialog classes={classes} onSuccess={() => router.refresh()} />

          <AddStudentDialog classes={classes} onSuccess={() => router.refresh()} />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-card p-4 rounded-xl border border-border">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              isAr
                ? 'بحث بالاسم، كود الطالب (S1001)، أو رقم الهاتف...'
                : 'Search by name, student code (S1001), or phone...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        {/* Class Filter */}
        <div className="w-full sm:w-48">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">{isAr ? 'جميع الفصول' : 'All Classes'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-36">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">{isAr ? 'كل الحالات' : 'All Status'}</option>
            <option value="active">{isAr ? 'نشط (Active)' : 'Active'}</option>
            <option value="inactive">{isAr ? 'غير نشط (معلق)' : 'Inactive (Suspended)'}</option>
            <option value="archived">{isAr ? 'مؤرشف' : 'Archived'}</option>
          </select>
        </div>
      </div>

      {/* Floating Bulk Actions Bar when items are selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-primary text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {selectedIds.size}
            </span>
            <span>{isAr ? `طالب محدد` : `students selected`}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={() => handleBulkStatusChange('active')}
              disabled={bulkLoading}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{isAr ? 'تفعيل الحسابات' : 'Activate'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs bg-emerald-600/90 hover:bg-emerald-600 text-white border-0 shadow-sm"
              onClick={() => setBroadcastOpen(true)}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{isAr ? 'واتساب للمحددين' : 'WhatsApp Selected'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={() => handleBulkStatusChange('inactive')}
              disabled={bulkLoading}
            >
              <UserX className="h-3.5 w-3.5" />
              <span>{isAr ? 'تعليق الحسابات' : 'Suspend'}</span>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs shadow-md"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={bulkLoading}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isAr ? `حذف المحدد (${selectedIds.size})` : `Delete Selected (${selectedIds.size})`}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setSelectedIds(new Set())}
            >
              {isAr ? 'إلغاء التحديد' : 'Deselect'}
            </Button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {isAr
            ? `عرض ${filteredStudents.length} من أصل ${initialStudents.length} طالب`
            : `Showing ${filteredStudents.length} of ${initialStudents.length} students`}
        </span>
      </div>

      {/* Students Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="p-3 w-10 text-center">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={handleToggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="p-3 text-start">{isAr ? 'الطالب' : 'Student'}</th>
                <th className="p-3 text-start">{isAr ? 'الكود' : 'Code'}</th>
                <th className="p-3 text-start">{isAr ? 'الفصول الدراسية' : 'Enrolled Classes'}</th>
                <th className="p-3 text-start">{isAr ? 'الهاتف' : 'Phone'}</th>
                <th className="p-3 text-start">{isAr ? 'ولي الأمر' : 'Parent Phone'}</th>
                <th className="p-3 text-start">{isAr ? 'حالة الحساب' : 'Account Status'}</th>
                <th className="p-3 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <p className="text-base font-semibold">{isAr ? 'لم يتم العثور على طلاب' : 'No students found'}</p>
                    <p className="text-xs mt-1">
                      {isAr ? 'جرب تغيير شروط البحث أو الفلترة' : 'Try adjusting your search or filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedIds.has(s.id)
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelectRow(s.id)}
                          aria-label={`Select ${s.full_name}`}
                        />
                      </td>

                      {/* Student Name & Avatar */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-bold">
                              {getInitials(s.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/${locale}/students/${s.id}`}
                              className="font-semibold text-foreground hover:text-primary hover:underline transition-colors block"
                            >
                              {s.full_name}
                            </Link>
                            <p className="text-[11px] text-muted-foreground">
                              {isAr ? 'انضم:' : 'Joined:'} {s.enrolled_on}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Student Code */}
                      <td className="p-3">
                        <button
                          onClick={() => handleCopy(s.student_code)}
                          className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-1 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                          title={isAr ? 'اضغط لنسخ الكود' : 'Click to copy code'}
                        >
                          <span>{s.student_code}</span>
                          {copiedCode === s.student_code ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground opacity-60" />
                          )}
                        </button>
                      </td>

                      {/* Classes */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {s.classes.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">
                              {isAr ? 'غير مسجل بفصل' : 'No classes'}
                            </span>
                          ) : (
                            s.classes.map((c) => (
                              <Badge key={c.id} variant="secondary" className="text-[11px] font-normal gap-1">
                                <GraduationCap className="h-3 w-3 opacity-60" />
                                <span>{c.name.split(' - ')[0]}</span>
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-3">
                        {s.phone ? (
                          <a
                            href={`tel:${s.phone}`}
                            className="font-mono text-xs text-foreground/80 hover:text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3 opacity-50" />
                            <span>{s.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Parent Phone */}
                      <td className="p-3">
                        {s.parent_phone ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${s.parent_phone}`}
                              className="font-mono text-xs text-foreground/80 hover:text-primary hover:underline"
                            >
                              {s.parent_phone}
                            </a>
                            <a
                              href={`https://wa.me/2${s.parent_phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-500 hover:text-emerald-600"
                              title={isAr ? 'مراسلة عبر واتساب' : 'Chat on WhatsApp'}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Interactive Status Dropdown Badge */}
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="cursor-pointer focus:outline-none"
                              title={isAr ? 'اضغط لتغيير حالة الحساب' : 'Click to change status'}
                            >
                              <Badge
                                variant={
                                  s.status === 'active'
                                    ? 'default'
                                    : s.status === 'inactive'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className={`gap-1 cursor-pointer transition-all hover:scale-105 ${
                                  s.status === 'active'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30 font-medium'
                                    : s.status === 'inactive'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border-amber-500/30'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <span>
                                  {s.status === 'active'
                                    ? isAr ? 'نشط (مفعل)' : 'Active'
                                    : s.status === 'inactive'
                                    ? isAr ? 'معلق (محظور)' : 'Suspended'
                                    : isAr ? 'مؤرشف' : 'Archived'}
                                </span>
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                              {isAr ? 'تغيير حالة الحساب:' : 'Change Account Status:'}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(s.id, 'active')}
                              className="gap-2 text-emerald-600 dark:text-emerald-400"
                            >
                              <UserCheck className="h-4 w-4" />
                              <span>{isAr ? 'نشط (السماح بالدخول)' : 'Active (Allow Login)'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(s.id, 'inactive')}
                              className="gap-2 text-amber-600 dark:text-amber-400"
                            >
                              <UserX className="h-4 w-4" />
                              <span>{isAr ? 'معلق (حظر الدخول)' : 'Suspended (Block Login)'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(s.id, 'archived')}
                              className="gap-2 text-muted-foreground"
                            >
                              <Archive className="h-4 w-4" />
                              <span>{isAr ? 'مؤرشف (منتهي)' : 'Archived (Graduated)'}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      {/* Actions Menu */}
                      <td className="p-3 text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onSelect={() => router.push(`/${locale}/students/${s.id}`)}
                              className="gap-2 cursor-pointer text-primary font-semibold"
                            >
                              <Eye className="h-4 w-4" />
                              <span>{isAr ? 'الملف الأكاديمي الشامل' : 'View Full Dossier'}</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => {
                                setEditingStudent(s)
                                setEditOpen(true)
                              }}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              <span>{isAr ? 'تعديل البيانات' : 'Edit Student'}</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleCopy(s.student_code)}
                              className="gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              <span>{isAr ? 'نسخ كود الطالب' : 'Copy Code'}</span>
                            </DropdownMenuItem>

                            {s.parent_phone && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={`https://wa.me/2${s.parent_phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{isAr ? 'واتساب ولي الأمر' : 'WhatsApp Parent'}</span>
                                </a>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => setStudentToDelete(s)}
                              className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>{isAr ? 'حذف الحساب...' : 'Delete Account...'}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Dialog */}
      <EditStudentDialog
        student={editingStudent}
        classes={classes}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => router.refresh()}
      />

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={!!studentToDelete} onOpenChange={(o) => { if (!o) setStudentToDelete(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>{isAr ? 'تأكيد حذف حساب الطالب' : 'Confirm Account Deletion'}</span>
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف حساب الطالب "${studentToDelete?.full_name}" (${studentToDelete?.student_code})؟`
                : `Are you sure you want to permanently delete "${studentToDelete?.full_name}" (${studentToDelete?.student_code})?`}
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            {isAr
              ? '⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف حساب تسجيل الدخول، وسجل الحضور والغياب، وفواتير الرسوم بالكامل.'
              : '⚠️ Warning: This action cannot be undone. The login account, attendance records, and payment history will be permanently deleted.'}
          </p>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStudentToDelete(null)}
              disabled={deleteLoading}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmSingleDelete}
              loading={deleteLoading}
            >
              {isAr ? 'تأكيد الحذف' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>{isAr ? 'تأكيد الحذف الجماعي' : 'Confirm Bulk Deletion'}</span>
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف ${selectedIds.size} حساب طالب محدد نهائياً؟`
                : `Are you sure you want to permanently delete all ${selectedIds.size} selected student accounts?`}
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            {isAr
              ? '⚠️ تحذير: سيتم حذف جميع الحسابات المحددة مع سجلات الدخول وسجلات الحضور والرسوم نهائياً.'
              : '⚠️ Warning: All selected student accounts, login credentials, attendance, and financial history will be permanently deleted.'}
          </p>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkDeleteOpen(false)}
              disabled={bulkLoading}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmBulkDelete}
              loading={bulkLoading}
            >
              {isAr ? `تأكيد حذف (${selectedIds.size})` : `Delete (${selectedIds.size}) Students`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Phone className="h-5 w-5" />
              <span>{isAr ? 'إرسال رسائل واتساب جماعية' : 'Broadcast WhatsApp Message'}</span>
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? 'أرسل إشعارات، تقارير، أو تنبيهات هامة لأولياء الأمور أو الطلاب عبر واتساب بضغطة واحدة.'
                : 'Send notices, reminders, or updates to parents or students via WhatsApp.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Target Audience summary */}
            {(() => {
              const targetStudents =
                selectedIds.size > 0
                  ? initialStudents.filter((s) => selectedIds.has(s.id))
                  : filteredStudents

              const withParentPhone = targetStudents.filter((s) => !!s.parent_phone)
              const withStudentPhone = targetStudents.filter((s) => !!s.phone)
              const activeCount = broadcastTarget === 'parent' ? withParentPhone.length : withStudentPhone.length

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                      {selectedIds.size > 0
                        ? (isAr ? `المحدد: ${selectedIds.size} طالب` : `Selected: ${selectedIds.size} students`)
                        : (isAr ? `كل المعروضين: ${filteredStudents.length} طالب` : `All Filtered: ${filteredStudents.length} students`)}
                    </span>
                    <span className="text-muted-foreground">
                      {isAr
                        ? `(${activeCount} يملكون أرقام هاتف مسجلة)`
                        : `(${activeCount} have phone numbers)`}
                    </span>
                  </div>

                  {/* Target phone toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('parent')}
                      className={`p-2 rounded-lg text-xs font-semibold border transition-colors ${
                        broadcastTarget === 'parent'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {isAr ? `أولياء الأمور (${withParentPhone.length})` : `Parents (${withParentPhone.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('student')}
                      className={`p-2 rounded-lg text-xs font-semibold border transition-colors ${
                        broadcastTarget === 'student'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {isAr ? `الطلاب مباشرة (${withStudentPhone.length})` : `Students (${withStudentPhone.length})`}
                    </button>
                  </div>

                  {/* Message Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {isAr ? 'نص الرسالة:' : 'Message Text:'}
                    </label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full min-h-[90px] rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder={isAr ? 'اكتب الرسالة هنا...' : 'Write message here...'}
                    />
                  </div>

                  {/* Recipients List with Direct WhatsApp link */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">
                      {isAr ? 'قائمة المستلمين (اضغط لإرسال الرسالة فورا):' : 'Recipients (Click to send message):'}
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border bg-muted/20">
                      {targetStudents.map((s) => {
                        const rawPhone = broadcastTarget === 'parent' ? s.parent_phone : s.phone
                        const cleanP = formatPhoneForWA(rawPhone)
                        const waUrl = cleanP
                          ? `https://wa.me/${cleanP}?text=${encodeURIComponent(
                              `${broadcastMessage}\n\n— الطالب: ${s.full_name} (${s.student_code})\nأكاديمية م. عمرو حاتم`
                            )}`
                          : null

                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{s.full_name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {s.student_code} • {rawPhone || (isAr ? 'لا يوجد رقم' : 'No phone')}
                              </p>
                            </div>

                            {waUrl ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-medium text-[11px] hover:bg-emerald-700 transition-colors shrink-0 shadow-sm"
                              >
                                <Phone className="h-3 w-3" />
                                <span>{isAr ? 'إرسال واتساب' : 'Open WhatsApp'}</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic shrink-0">
                                {isAr ? 'بدون رقم' : 'No phone'}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setBroadcastOpen(false)}>
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

