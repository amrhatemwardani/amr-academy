'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Check, Copy, UserCheck, AlertCircle } from 'lucide-react'
import { createStudentAction } from './actions'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'

interface ClassItem {
  id: string
  name: string
}

interface AddStudentDialogProps {
  classes: ClassItem[]
  onSuccess?: () => void
}

export function AddStudentDialog({ classes, onSuccess }: AddStudentDialogProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [email, setEmail] = useState('')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [password, setPassword] = useState('Student@123456')
  const [mustChangePassword, setMustChangePassword] = useState(false)

  // Success state
  const [createdStudent, setCreatedStudent] = useState<{
    studentCode: string
    fullName: string
    password: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    )
  }

  const resetForm = () => {
    setFullName('')
    setPhone('')
    setParentPhone('')
    setEmail('')
    setSelectedClassIds([])
    setPassword('Student@123456')
    setMustChangePassword(false)
    setError(null)
    setCreatedStudent(null)
    setCopied(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError(isAr ? 'يرجى إدخال اسم الطالب بالكامل' : 'Full name must be at least 2 characters')
      return
    }

    try {
      setLoading(true)
      const res = await createStudentAction(
        {
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          parentPhone: parentPhone.trim() || null,
          email: email.trim() || null,
          classIds: selectedClassIds,
          password,
          mustChangePassword,
        },
        locale
      )

      if (res.success && res.data) {
        setCreatedStudent({
          studentCode: res.data.studentCode,
          fullName: res.data.fullName,
          password: res.data.password,
        })
        toast.success(isAr ? 'تم إنشاء حساب الطالب بنجاح' : 'Student account created successfully')
        if (onSuccess) onSuccess()
      } else {
        setError(res.error || (isAr ? 'حدث خطأ أثناء الإنشاء' : 'Failed to create student'))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!createdStudent) return
    const text = isAr
      ? `مرحباً بك في أكاديمية عمرو!\nبيانات تسجيل الدخول:\nكود الطالب: ${createdStudent.studentCode}\nكلمة المرور: ${createdStudent.password}\nرابط الدخول: ${window.location.origin}/ar/login`
      : `Welcome to Amr Academy!\nYour Login Credentials:\nStudent Code: ${createdStudent.studentCode}\nPassword: ${createdStudent.password}\nLogin URL: ${window.location.origin}/en/login`

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(isAr ? 'تم نسخ بيانات الدخول إلى الحافظة' : 'Credentials copied to clipboard')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{isAr ? 'إضافة طالب' : 'Add Student'}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAr ? 'إضافة طالب جديد' : 'Add New Student'}
          </DialogTitle>
        </DialogHeader>

        {createdStudent ? (
          <div className="space-y-4 py-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <UserCheck className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  {isAr ? 'تم تسجيل الطالب بنجاح!' : 'Student Registered Successfully!'}
                </p>
                <p className="text-xs opacity-90">{createdStudent.fullName}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'كود الطالب (اسم المستخدم):' : 'Student Code (Login ID):'}</span>
                <p className="font-mono font-bold text-lg text-primary">{createdStudent.studentCode}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'كلمة المرور المؤقتة:' : 'Temporary Password:'}</span>
                <p className="font-mono font-semibold text-sm">{createdStudent.password}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopyCredentials}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ بيانات الدخول' : 'Copy Credentials')}</span>
            </Button>

            <DialogFooter className="sm:justify-between pt-2">
              <Button type="button" variant="ghost" onClick={resetForm}>
                {isAr ? 'إضافة طالب آخر' : 'Add Another'}
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                {isAr ? 'تم' : 'Done'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">
                {isAr ? 'اسم الطالب بالكامل' : 'Full Name'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder={isAr ? 'مثال: يوسف عمرو حسان' : 'e.g. Youssef Amr'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Phone & Parent Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">{isAr ? 'رقم هاتف الطالب' : 'Student Phone'}</Label>
                <Input
                  id="phone"
                  placeholder="010xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parentPhone">{isAr ? 'رقم هاتف ولي الأمر' : 'Parent Phone'}</Label>
                <Input
                  id="parentPhone"
                  placeholder="010xxxxxxxx"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Assign Classes Multi-Select */}
            <div className="space-y-1.5">
              <Label>{isAr ? 'الفصول الدراسية (يمكن اختيار أكثر من فصل)' : 'Assign Classes (Select one or more)'}</Label>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-input bg-transparent p-2 space-y-1">
                {classes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    {isAr ? 'لا توجد فصول دراسية بعد' : 'No classes available yet'}
                  </p>
                ) : (
                  classes.map((c) => {
                    const checked = selectedClassIds.includes(c.id)
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                          checked ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleClass(c.id)}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <span className="text-xs">{c.name}</span>
                      </label>
                    )
                  })
                )}
              </div>
              {selectedClassIds.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {isAr
                    ? `✓ تم اختيار ${selectedClassIds.length} فصل`
                    : `✓ Selected ${selectedClassIds.length} class${selectedClassIds.length !== 1 ? 'es' : ''}`}
                </p>
              )}
            </div>

            {/* Initial Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">{isAr ? 'كلمة المرور الأولية' : 'Initial Password'}</Label>
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                {isAr
                  ? 'يمكن للطالب تسجيل الدخول باستخدام كود الطالب وكلمة المرور هذه.'
                  : 'Student can log in using their code and this password.'}
              </p>
            </div>

            {/* Must Change Password Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="mustChange"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="mustChange" className="text-xs cursor-pointer">
                {isAr ? 'إلزام الطالب بتغيير كلمة المرور عند أول دخول' : 'Require password change on first login'}
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" loading={loading}>
                {isAr ? 'حفظ وإنشاء الحساب' : 'Save & Create Student'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
