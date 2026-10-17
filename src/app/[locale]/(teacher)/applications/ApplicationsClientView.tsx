'use client'

import { useState, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  Search,
  Phone,
  MessageSquare,
  Building,
  Sparkles,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Calendar,
  Filter,
  Users,
} from 'lucide-react'
import { updateApplicationStatusAction, deleteApplicationAction, type ApplicationItem } from '@/lib/applications/actions'

interface Props {
  locale: string
  applications: ApplicationItem[]
}

const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
  sec1: { ar: 'الصف الأول الثانوي', en: '1st Secondary (Sec 1)' },
  sec2: { ar: 'الصف الثاني الثانوي', en: '2nd Secondary (Sec 2)' },
  sec3: { ar: 'الصف الثالث الثانوي (ثانوية عامة)', en: '3rd Secondary (Thanaweya)' },
}

const SUBJECT_LABELS: Record<string, { ar: string; en: string }> = {
  physics: { ar: 'الفيزياء', en: 'Physics' },
  math: { ar: 'الرياضيات', en: 'Mathematics' },
  both: { ar: 'الفيزياء والرياضيات', en: 'Both Physics & Math' },
}

const MODE_LABELS: Record<string, { ar: string; en: string }> = {
  center: { ar: 'سنتر مباشر 🏢', en: 'Center' },
  online: { ar: 'أونلاين منصة ⚡', en: 'Online' },
}

const STATUS_CONFIG = {
  pending: {
    labelAr: 'قيد المراجعة',
    labelEn: 'Pending',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-500',
  },
  contacted: {
    labelAr: 'تم التواصل',
    labelEn: 'Contacted',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    dotClass: 'bg-blue-500',
  },
  enrolled: {
    labelAr: 'تم القبول والاشتراك',
    labelEn: 'Enrolled',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  rejected: {
    labelAr: 'مرفوض / غير متاح',
    labelEn: 'Rejected',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    dotClass: 'bg-rose-500',
  },
}

export function ApplicationsClientView({ locale, applications }: Props) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')

  // Filtered list
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        !search ||
        app.studentName.toLowerCase().includes(search.toLowerCase()) ||
        app.code.toLowerCase().includes(search.toLowerCase()) ||
        app.studentPhone.includes(search) ||
        app.parentPhone.includes(search) ||
        (app.governorate || '').toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'all' || app.status === statusFilter
      const matchGrade = gradeFilter === 'all' || app.grade === gradeFilter

      return matchSearch && matchStatus && matchGrade
    })
  }, [applications, search, statusFilter, gradeFilter])

  // Stats
  const total = applications.length
  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const contactedCount = applications.filter((a) => a.status === 'contacted').length
  const enrolledCount = applications.filter((a) => a.status === 'enrolled').length

  const handleStatusChange = (id: string, newStatus: any) => {
    startTransition(async () => {
      const res = await updateApplicationStatusAction(id, newStatus)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isAr ? 'تم تحديث حالة الطلب بنجاح' : 'Status updated')
        router.refresh()
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Delete this application?')) return
    startTransition(async () => {
      const res = await deleteApplicationAction(id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isAr ? 'تم حذف الطلب' : 'Application deleted')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-[#0050e3]" />
            <span>{isAr ? 'طلبات الالتحاق والانضمام' : 'Admission Applications'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">
            {isAr
              ? 'متابعة بيانات الطلاب المتقدمين عبر استمارة الموقع والتواصل معهم'
              : 'Review new admission applications from the public apply form'}
          </p>
        </div>

        <span className="rounded-full bg-[#fff8e1] border-2 border-[#f6b407] px-4 py-1.5 text-xs font-black text-[#c48b05] shadow-xs">
          ⚡ {total} {isAr ? 'إجمالي الطلبات' : 'Total Submissions'}
        </span>
      </div>

      {/* ── Stats Summary KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border-2 border-amber-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-gray-500">{isAr ? 'طلبات جديدة' : 'Pending'}</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border-2 border-blue-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-gray-500">{isAr ? 'تم التواصل' : 'Contacted'}</p>
          <p className="text-2xl font-black text-[#0050e3] mt-1">{contactedCount}</p>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-gray-500">{isAr ? 'تم القبول والاشتراك' : 'Enrolled'}</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{enrolledCount}</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-gray-500">{isAr ? 'إجمالي الاستمارات' : 'Total'}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{total}</p>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم، كود الحجز، رقم الهاتف، أو المنطقة...' : 'Search by name, code, phone, or area...'}
              className="w-full rounded-xl border border-gray-200 bg-[#fcf6f3] ps-9 pe-4 py-2.5 text-xs sm:text-sm font-medium outline-none focus:border-[#f6b407] focus:ring-2 focus:ring-[#fff8e1]"
            />
          </div>

          {/* Grade filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-[#fcf6f3] px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-[#f6b407]"
          >
            <option value="all">{isAr ? 'جميع المراحل' : 'All Grades'}</option>
            <option value="sec1">{isAr ? 'الصف الأول الثانوي' : 'Sec 1'}</option>
            <option value="sec2">{isAr ? 'الصف الثاني الثانوي' : 'Sec 2'}</option>
            <option value="sec3">{isAr ? 'الصف الثالث الثانوي' : 'Sec 3'}</option>
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-full px-3.5 py-1 text-xs font-black transition-all ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({applications.length})
          </button>
          {(['pending', 'contacted', 'enrolled', 'rejected'] as const).map((st) => {
            const conf = STATUS_CONFIG[st]
            const count = applications.filter((a) => a.status === st).length
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-full px-3.5 py-1 text-xs font-black border transition-all ${
                  statusFilter === st
                    ? conf.badgeClass
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {conf[isAr ? 'labelAr' : 'labelEn']} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Applications Cards List ── */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-gray-700">
            {isAr ? 'لا توجد طلبات مطابقة للبحث' : 'No matching applications found'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {isAr ? 'أي طلب يتم إرساله من صفحة الانضمام سيظهر هنا فوراً.' : 'New applications from the public apply form will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
            const waStudentUrl = `https://wa.me/20${app.studentPhone.replace(/^0+/, '')}?text=${encodeURIComponent(
              `مرحباً يا ${app.studentName}، معك م. عمرو حاتم بخصوص طلب التحاقك بالأكاديمية (كود: ${app.code}).`
            )}`
            const waParentUrl = `https://wa.me/20${app.parentPhone.replace(/^0+/, '')}?text=${encodeURIComponent(
              `السلام عليكم ورحمة الله، مع حضراتكم إدارة أكاديمية م. عمرو حاتم بخصوص طلب انضمام الطالب (${app.studentName}) - كود الحجز: ${app.code}.`
            )}`

            return (
              <div
                key={app.id}
                className="rounded-3xl border-2 border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Top line badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-800 border border-gray-200">
                      {app.code}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {new Date(app.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-black bg-[#e8f4ff] text-[#0050e3] border border-blue-200">
                      {GRADE_LABELS[app.grade]?.[isAr ? 'ar' : 'en'] || app.grade}
                    </span>
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-black bg-[#fff8e1] text-[#c48b05] border border-amber-200">
                      {SUBJECT_LABELS[app.subject]?.[isAr ? 'ar' : 'en'] || app.subject}
                    </span>
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-700">
                      {MODE_LABELS[app.mode]?.[isAr ? 'ar' : 'en'] || app.mode}
                    </span>
                  </div>

                  {/* Student Name */}
                  <h3 className="text-lg font-black text-gray-950">
                    {app.studentName}
                  </h3>

                  {/* Governorate and Notes */}
                  <div className="text-xs text-gray-600 flex items-center gap-3 flex-wrap font-medium">
                    {app.governorate && (
                      <span className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5">
                        📍 {app.governorate}
                      </span>
                    )}
                    {app.notes && (
                      <span className="italic text-gray-500 bg-amber-50/50 rounded-lg px-2 py-0.5">
                        📝 {app.notes}
                      </span>
                    )}
                  </div>

                  {/* Phones and WhatsApp Direct Click Buttons */}
                  <div className="flex items-center gap-3 flex-wrap pt-1">
                    {app.studentPhone && (
                      <a
                        href={waStudentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 text-xs font-black shadow-2xs transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        <span>واتساب الطالب: <span dir="ltr">{app.studentPhone}</span></span>
                      </a>
                    )}

                    {app.parentPhone && (
                      <a
                        href={waParentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1.5 text-xs font-black shadow-2xs transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-[#0050e3]" />
                        <span>ولي الأمر: <span dir="ltr">{app.parentPhone}</span></span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Right / Actions Column */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400">{isAr ? 'الحالة:' : 'Status:'}</span>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      disabled={isPending}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black border-2 outline-none cursor-pointer transition-all ${statusConf.badgeClass}`}
                    >
                      <option value="pending">{isAr ? '🟡 قيد المراجعة' : 'Pending'}</option>
                      <option value="contacted">{isAr ? '🔵 تم التواصل' : 'Contacted'}</option>
                      <option value="enrolled">{isAr ? '🟢 تم القبول والاشتراك' : 'Enrolled'}</option>
                      <option value="rejected">{isAr ? '🔴 مرفوض' : 'Rejected'}</option>
                    </select>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(app.id)}
                    disabled={isPending}
                    title={isAr ? 'حذف الطلب' : 'Delete'}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
