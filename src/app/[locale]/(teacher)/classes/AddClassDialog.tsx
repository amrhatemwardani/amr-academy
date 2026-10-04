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
import { Plus, AlertCircle, BookOpen } from 'lucide-react'
import { createClassAction } from './actions'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'

interface AddClassDialogProps {
  onSuccess?: () => void
}

const DAYS = [
  { dow: 0, labelEn: 'Sun', labelAr: 'الأحد' },
  { dow: 1, labelEn: 'Mon', labelAr: 'الإثنين' },
  { dow: 2, labelEn: 'Tue', labelAr: 'الثلاثاء' },
  { dow: 3, labelEn: 'Wed', labelAr: 'الأربعاء' },
  { dow: 4, labelEn: 'Thu', labelAr: 'الخميس' },
  { dow: 5, labelEn: 'Fri', labelAr: 'الجمعة' },
  { dow: 6, labelEn: 'Sat', labelAr: 'السبت' },
]

export function AddClassDialog({ onSuccess }: AddClassDialogProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('Grade 10')
  const [monthlyFee, setMonthlyFee] = useState('500')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 4]) // Mon & Thu
  const [startTime, setStartTime] = useState('16:00')
  const [endTime, setEndTime] = useState('17:30')

  const toggleDay = (dow: number) => {
    if (selectedDays.includes(dow)) {
      setSelectedDays(selectedDays.filter((d) => d !== dow))
    } else {
      setSelectedDays([...selectedDays, dow].sort())
    }
  }

  const resetForm = () => {
    setName('')
    setSubject('')
    setLevel('Grade 10')
    setMonthlyFee('500')
    setSelectedDays([1, 4])
    setStartTime('16:00')
    setEndTime('17:30')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(isAr ? 'يرجى إدخال اسم الفصل' : 'Class name is required')
      return
    }

    try {
      setLoading(true)
      const schedule = selectedDays.map((d) => ({
        dow: d,
        start: startTime,
        end: endTime,
      }))

      const res = await createClassAction(
        {
          name: name.trim(),
          subject: subject.trim() || name.trim(),
          level,
          monthlyFee: parseFloat(monthlyFee) || 0,
          schedule,
        },
        locale
      )

      if (res.success) {
        toast.success(isAr ? 'تم إنشاء الفصل الدراسي بنجاح' : 'Class created successfully')
        setOpen(false)
        resetForm()
        if (onSuccess) onSuccess()
      } else {
        setError(res.error || 'Failed to create class')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{isAr ? 'إضافة فصل جديد' : 'Add Class'}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>{isAr ? 'إضافة فصل دراسي جديد' : 'Create New Class'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Class Name */}
          <div className="space-y-1.5">
            <Label htmlFor="className">{isAr ? 'اسم الفصل الدراسي' : 'Class Name'}</Label>
            <Input
              id="className"
              placeholder={isAr ? 'مثال: الرياضيات - الصف الأول الثانوي' : 'e.g. Mathematics - Grade 10'}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!subject) setSubject(e.target.value.split('-')[0].trim())
              }}
              required
            />
          </div>

          {/* Subject & Grade Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="subject">{isAr ? 'المادة الدراسية' : 'Subject'}</Label>
              <Input
                id="subject"
                placeholder={isAr ? 'رياضيات، فيزياء...' : 'Math, Physics...'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="level">{isAr ? 'المرحلة / الصف' : 'Grade / Level'}</Label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Grade 10">{isAr ? 'الصف الأول الثانوي (Grade 10)' : 'Grade 10'}</option>
                <option value="Grade 11">{isAr ? 'الصف الثاني الثانوي (Grade 11)' : 'Grade 11'}</option>
                <option value="Grade 12">{isAr ? 'الصف الثالث الثانوي (Grade 12)' : 'Grade 12'}</option>
                <option value="Middle School">{isAr ? 'المرحلة الإعدادية' : 'Middle School'}</option>
              </select>
            </div>
          </div>

          {/* Monthly Fee */}
          <div className="space-y-1.5">
            <Label htmlFor="monthlyFee">{isAr ? 'الاشتراك الشهري (بالجنيه EGP)' : 'Monthly Fee (EGP)'}</Label>
            <Input
              id="monthlyFee"
              type="number"
              min="0"
              step="any"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              placeholder={isAr ? 'أي مبلغ — مثال: 350' : 'Any amount — e.g. 350'}
            />
          </div>

          {/* Schedule Days */}
          <div className="space-y-2">
            <Label>{isAr ? 'أيام الحصص الأسبوعية' : 'Class Days (Weekly Schedule)'}</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => {
                const isSelected = selectedDays.includes(d.dow)
                return (
                  <button
                    key={d.dow}
                    type="button"
                    onClick={() => toggleDay(d.dow)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isAr ? d.labelAr : d.labelEn}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">{isAr ? 'وقت البدء' : 'Start Time'}</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">{isAr ? 'وقت الانتهاء' : 'End Time'}</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" loading={loading}>
              {isAr ? 'إنشاء الفصل' : 'Create Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
