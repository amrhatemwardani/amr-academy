'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateStudentAction, resetPasswordAction, deleteStudentAction } from './actions'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'
import { KeyRound, AlertCircle, Trash2 } from 'lucide-react'

interface StudentData {
  id: string
  student_code: string
  full_name: string
  phone: string | null
  parent_phone: string | null
  email: string | null
  status: 'active' | 'inactive' | 'archived'
  classes: Array<{ id: string; name: string }>
}

interface EditStudentDialogProps {
  student: StudentData | null
  classes: Array<{ id: string; name: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditStudentDialog({
  student,
  classes,
  open,
  onOpenChange,
  onSuccess,
}: EditStudentDialogProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>('active')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])

  // Reset password states
  const [showResetPw, setShowResetPw] = useState(false)
  const [newPassword, setNewPassword] = useState('Student@123456')
  const [resetLoading, setResetLoading] = useState(false)

  // Delete states
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Pre-fill whenever student/open changes
  useEffect(() => {
    if (student) {
      setFullName(student.full_name || '')
      setPhone(student.phone || '')
      setParentPhone(student.parent_phone || '')
      setStatus(student.status || 'active')
      setSelectedClassIds(student.classes.map((c) => c.id))
      setShowResetPw(false)
      setConfirmDelete(false)
      setError(null)
    }
  }, [student, open])

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return
    setError(null)

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError(isAr ? 'يرجى إدخال اسم الطالب' : 'Full name is required')
      return
    }

    try {
      setLoading(true)
      const res = await updateStudentAction(
        student.id,
        {
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          parentPhone: parentPhone.trim() || null,
          status,
          classIds: selectedClassIds,
        },
        locale
      )

      if (res.success) {
        toast.success(isAr ? 'تم تحديث بيانات الطالب وحالة الحساب' : 'Student and account status updated')
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        setError(res.error || 'Failed to update')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!student) return
    try {
      setResetLoading(true)
      const res = await resetPasswordAction(student.id, newPassword)
      if (res.success) {
        toast.success(isAr ? 'تم إعادة تعيين كلمة المرور بنجاح' : 'Password reset successfully')
        setShowResetPw(false)
      } else {
        toast.error(res.error || 'Failed to reset password')
      }
    } catch {
      toast.error('Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!student) return
    try {
      setDeleteLoading(true)
      const res = await deleteStudentAction(student.id, locale)
      if (res.success) {
        toast.success(isAr ? 'تم حذف حساب الطالب نهائياً' : 'Student account permanently deleted')
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(res.error || 'Failed to delete student')
      }
    } catch {
      toast.error('Failed to delete student')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isAr ? 'تعديل بيانات الطالب' : 'Edit Student'}</span>
            <span className="font-mono text-sm px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
              {student.student_code}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="editFullName">{isAr ? 'الاسم بالكامل' : 'Full Name'}</Label>
            <Input
              id="editFullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Phone & Parent Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editPhone">{isAr ? 'هاتف الطالب' : 'Student Phone'}</Label>
              <Input
                id="editPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editParentPhone">{isAr ? 'هاتف ولي الأمر' : 'Parent Phone'}</Label>
              <Input
                id="editParentPhone"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Assign Classes — multi-select checkboxes */}
          <div className="space-y-1.5">
            <Label>{isAr ? 'الفصول الدراسية (يمكن اختيار أكثر من فصل)' : 'Classes (select one or more)'}</Label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-input bg-transparent p-2 space-y-1">
              {classes.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  {isAr ? 'لا توجد فصول دراسية' : 'No classes available'}
                </p>
              ) : (
                classes.map((c) => {
                  const checked = selectedClassIds.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                        checked ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleClass(c.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  )
                })
              )}
            </div>
            {selectedClassIds.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {isAr
                  ? `✓ مسجل في ${selectedClassIds.length} فصل`
                  : `✓ Enrolled in ${selectedClassIds.length} class${selectedClassIds.length !== 1 ? 'es' : ''}`}
              </p>
            )}
          </div>

          {/* Status with explanation */}
          <div className="space-y-1.5">
            <Label htmlFor="editStatus">{isAr ? 'حالة الحساب' : 'Account Status'}</Label>
            <select
              id="editStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'archived')}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="active">{isAr ? 'نشط (مفعل - يمكنه الدخول)' : 'Active (Enabled - Can log in)'}</option>
              <option value="inactive">{isAr ? 'غير نشط (معلق - لا يمكنه الدخول)' : 'Inactive (Suspended - Login blocked)'}</option>
              <option value="archived">{isAr ? 'مؤرشف (حساب منتهي)' : 'Archived (Graduated/Left)'}</option>
            </select>
            <p className="text-[11px] text-muted-foreground">
              {status === 'active'
                ? isAr ? '✓ حساب الطالب مفعل ويستطيع تسجيل الدخول للمنصة.' : '✓ Student account is active and can sign in.'
                : isAr ? '⚠️ الحساب معلق ولن يتمكن الطالب من تسجيل الدخول.' : '⚠️ Account is suspended and student cannot sign in.'}
            </p>
          </div>

          {/* Reset Password accordion */}
          <div className="pt-2 border-t border-border">
            {!showResetPw ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowResetPw(true)}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Student Password'}</span>
              </Button>
            ) : (
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
                <Label htmlFor="newPw" className="text-xs">
                  {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="newPw"
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    onClick={handleResetPassword}
                    loading={resetLoading}
                  >
                    {isAr ? 'تأكيد' : 'Reset'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setShowResetPw(false)}
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Delete Danger Zone */}
          <div className="pt-2 border-t border-border">
            {!confirmDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive w-full justify-start"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isAr ? 'حذف حساب الطالب نهائياً...' : 'Delete Student Account...'}</span>
              </Button>
            ) : (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-2">
                <p className="text-xs font-medium text-destructive">
                  {isAr
                    ? 'هل أنت متأكد؟ سيتم حذف الحساب وبيانات الحضور والرسوم نهائياً.'
                    : 'Are you sure? This will permanently delete the login, attendance, and fee history.'}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleDelete}
                    loading={deleteLoading}
                  >
                    {isAr ? 'نعم، احذف الحساب' : 'Yes, Delete'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setConfirmDelete(false)}
                  >
                    {isAr ? 'تراجع' : 'Cancel'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" loading={loading}>
              {isAr ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
