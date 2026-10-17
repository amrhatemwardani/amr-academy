'use client'

import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  KeyRound,
  History,
  Search,
  Copy,
  Check,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  ScanFace,
  UserCheck,
  Users,
  Lock,
  Loader2,
  Trash2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import {
  type LoginAuditItem,
  type StudentCredentialItem,
  teacherResetStudentPasswordAction,
  teacherRevokeStudentFaceIdAction,
  getLoginAuditsAction,
} from '@/lib/audit/actions'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'

interface Props {
  locale: string
  initialStudents: StudentCredentialItem[]
  initialAudits: LoginAuditItem[]
  appUrl: string
}

export function LoginAuditClientView({
  locale,
  initialStudents,
  initialAudits,
  appUrl,
}: Props) {
  const isAr = locale === 'ar'

  const [activeTab, setActiveTab] = useState<'credentials' | 'audit'>('credentials')
  const [students, setStudents] = useState<StudentCredentialItem[]>(initialStudents)
  const [audits, setAudits] = useState<LoginAuditItem[]>(initialAudits)
  const [refreshingAudits, setRefreshingAudits] = useState(false)

  // Search & Filter
  const [search, setSearch] = useState('')
  const [mustChangeFilter, setMustChangeFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [faceIdFilter, setFaceIdFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | 'success' | 'failed'>('all')
  const [auditMethodFilter, setAuditMethodFilter] = useState<'all' | 'password' | 'face_id'>('all')

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Reset Password Dialog State
  const [selectedStudent, setSelectedStudent] = useState<StudentCredentialItem | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('Student@123456')
  const [requireChangeOnLogin, setRequireChangeOnLogin] = useState(true)
  const [resetLoading, setResetLoading] = useState(false)

  // Revoke Face ID Dialog State
  const [revokeFaceIdStudent, setRevokeFaceIdStudent] = useState<StudentCredentialItem | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)

  // Quick Stats
  const totalStudents = students.length
  const pendingPasswordChangeCount = students.filter((s) => s.mustChangePassword).length
  const faceIdEnrolledCount = students.filter((s) => s.hasFaceId).length
  const successfulLoginsCount = audits.filter((a) => a.success).length
  const failedLoginsCount = audits.filter((a) => !a.success).length

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        s.studentCode.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.parentPhone && s.parentPhone.includes(q)) ||
        s.email.toLowerCase().includes(q)

      const matchesMustChange =
        mustChangeFilter === 'all'
          ? true
          : mustChangeFilter === 'yes'
          ? s.mustChangePassword
          : !s.mustChangePassword

      const matchesFaceId =
        faceIdFilter === 'all'
          ? true
          : faceIdFilter === 'yes'
          ? s.hasFaceId
          : !s.hasFaceId

      return matchesSearch && matchesMustChange && matchesFaceId
    })
  }, [students, search, mustChangeFilter, faceIdFilter])

  // Filtered Audits
  const filteredAudits = useMemo(() => {
    return audits.filter((a) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        a.identifier.toLowerCase().includes(q) ||
        (a.studentCode && a.studentCode.toLowerCase().includes(q)) ||
        (a.studentName && a.studentName.toLowerCase().includes(q))

      const matchesStatus =
        auditStatusFilter === 'all'
          ? true
          : auditStatusFilter === 'success'
          ? a.success
          : !a.success

      const matchesMethod =
        auditMethodFilter === 'all'
          ? true
          : a.method === auditMethodFilter

      return matchesSearch && matchesStatus && matchesMethod
    })
  }, [audits, search, auditStatusFilter, auditMethodFilter])

  // Refresh Audits
  async function handleRefreshAudits() {
    setRefreshingAudits(true)
    try {
      const data = await getLoginAuditsAction(100)
      setAudits(data)
      toast.success(isAr ? 'تم تحديث سجل الدخول' : 'Audit logs refreshed')
    } catch {
      toast.error(isAr ? 'فشل التحديث' : 'Failed to refresh')
    } finally {
      setRefreshingAudits(false)
    }
  }

  // Copy Full WhatsApp Credentials
  function handleCopyCredentials(s: StudentCredentialItem) {
    const loginUrl = `${appUrl}/${locale}/login`
    const defaultPass = s.mustChangePassword ? 'Student@123456' : '(كلمة المرور المحددة للطالب)'

    const msg = isAr
      ? `🎓 *أكاديمية المهندس عمرو حاتم للفيزياء*\n\n` +
        `مرحباً بك عزيزي الطالب/ولي الأمر،\n` +
        `بيانات تسجيل الدخول لحساب الطالب: *${s.fullName}*\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `🔹 *كود الطالب:* \`${s.studentCode}\`\n` +
        `🔹 *كلمة المرور:* \`${defaultPass}\`\n` +
        `🔗 *رابط منصة الطالب:* ${loginUrl}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        (s.mustChangePassword
          ? `⚠️ *تنبيه:* سيُطلب منك تعيين كلمة مرور جديدة خاصة بك عند أول تسجيل دخول.\n\n`
          : `\n`) +
        `⚡ يدعم الموقع الدخول السريع عبر بصمة الوجه (Face ID) من المتصفح مباشرة!`
      : `🎓 *Eng. Amr Hatem Academy*\n\n` +
        `Student Login Credentials for: *${s.fullName}*\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `🔹 Student Code: \`${s.studentCode}\`\n` +
        `🔹 Password: \`${defaultPass}\`\n` +
        `🔗 Login URL: ${loginUrl}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        (s.mustChangePassword
          ? `⚠️ Notice: You will be asked to set a new password on your first sign in.\n\n`
          : `\n`) +
        `⚡ Supports Face ID & Biometric sign in directly from your browser!`

    navigator.clipboard.writeText(msg)
    setCopiedId(s.id)
    setTimeout(() => setCopiedId(null), 2500)
    toast.success(isAr ? 'تم نسخ بيانات الدخول جاهزة للواتساب 📋' : 'Credentials copied to clipboard')
  }

  // Generate WhatsApp Direct Link
  function getWhatsAppHref(s: StudentCredentialItem) {
    const phone = s.phone || s.parentPhone || ''
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const targetPhone = cleanPhone.startsWith('0')
      ? `20${cleanPhone.slice(1)}`
      : cleanPhone

    const loginUrl = `${appUrl}/${locale}/login`
    const defaultPass = s.mustChangePassword ? 'Student@123456' : '(كلمة مرور الطالب)'

    const text = isAr
      ? `مرحباً ${s.fullName}، إليك بيانات الدخول لمنصة أكاديمية م. عمرو حاتم:\nكود الطالب: ${s.studentCode}\nكلمة المرور: ${defaultPass}\nرابط الدخول: ${loginUrl}`
      : `Hello ${s.fullName}, your Amr Academy portal login:\nStudent Code: ${s.studentCode}\nPassword: ${defaultPass}\nLogin Link: ${loginUrl}`

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
  }

  // Handle Teacher Reset Password
  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStudent) return

    setResetLoading(true)
    const res = await teacherResetStudentPasswordAction({
      studentId: selectedStudent.id,
      studentCode: selectedStudent.studentCode,
      studentName: selectedStudent.fullName,
      newPassword,
      mustChangePassword: requireChangeOnLogin,
    })

    setResetLoading(false)

    if (res.success) {
      toast.success(
        isAr
          ? `تم تحديث كلمة المرور للطالب ${selectedStudent.studentCode} بنجاح`
          : 'Password updated successfully'
      )
      setStudents((prev) =>
        prev.map((item) =>
          item.id === selectedStudent.id
            ? { ...item, mustChangePassword: requireChangeOnLogin }
            : item
        )
      )
      setResetDialogOpen(false)
    } else {
      toast.error(res.error || 'Failed to reset password')
    }
  }

  // Handle Revoke Face ID
  async function handleRevokeFaceId() {
    if (!revokeFaceIdStudent) return

    setRevokeLoading(true)
    const res = await teacherRevokeStudentFaceIdAction({
      studentId: revokeFaceIdStudent.id,
      studentCode: revokeFaceIdStudent.studentCode,
      studentName: revokeFaceIdStudent.fullName,
    })

    setRevokeLoading(false)

    if (res.success) {
      toast.success(isAr ? 'تم إلغاء تفعيل بصمة الوجه للطالب' : 'Face ID revoked')
      setStudents((prev) =>
        prev.map((item) =>
          item.id === revokeFaceIdStudent.id ? { ...item, hasFaceId: false } : item
        )
      )
      setRevokeFaceIdStudent(null)
    } else {
      toast.error(res.error || 'Failed to revoke Face ID')
    }
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <span>{isAr ? 'بيانات الدخول وسجل الأمان' : 'Login Credentials & Audit Log'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isAr
              ? 'إدارة حسابات وكلمات مرور الطلاب، متابعة عمليات تسجيل الدخول، والتحكم ببصمة الوجه (Face ID).'
              : 'Manage student login credentials, audit session logs, and control Face ID biometrics.'}
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex rounded-2xl bg-muted p-1 text-xs font-bold shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'credentials'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <KeyRound className="h-4 w-4 text-amber-500" />
            <span>{isAr ? 'بيانات الدخول والصلاحيات' : 'Credentials Hub'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 font-mono">
              {students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'audit'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-4 w-4 text-blue-500" />
            <span>{isAr ? 'سجل عمليات الدخول (Audit)' : 'Login Audit Log'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 font-mono">
              {audits.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Highlights ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي الطلاب' : 'Total Students'}</p>
              <p className="text-2xl font-black mt-0.5">{totalStudents}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'مطلوب تغيير كلمة المرور' : 'Pending Password Change'}
              </p>
              <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingPasswordChangeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? 'مفعل لهم Face ID' : 'Face ID Enabled'}</p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">{faceIdEnrolledCount}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <ScanFace className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'عمليات الدخول الناجحة' : 'Successful Logins'}
              </p>
              <p className="text-2xl font-black text-blue-600 mt-0.5">{successfulLoginsCount}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border rounded-2xl p-3.5 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'credentials'
                ? isAr
                  ? 'بحث بكود الطالب، الاسم، الهاتف، أو البريد...'
                  : 'Search by student code, name, phone, or email...'
                : isAr
                ? 'بحث بكود الطالب أو المعرّف...'
                : 'Search audit logs...'
            }
            className="w-full h-10 rounded-xl border border-input bg-background ps-9 pe-4 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {activeTab === 'credentials' ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Filter Must Change Password */}
            <select
              value={mustChangeFilter}
              onChange={(e) => setMustChangeFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold outline-none shrink-0"
            >
              <option value="all">{isAr ? 'كل حالات كلمة المرور' : 'All Password States'}</option>
              <option value="yes">{isAr ? '⚠️ مطلوب تغييرها فقط' : 'Pending Change Only'}</option>
              <option value="no">{isAr ? '✓ كلمة المرور مستقرة' : 'Normal / Updated'}</option>
            </select>

            {/* Filter Face ID */}
            <select
              value={faceIdFilter}
              onChange={(e) => setFaceIdFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold outline-none shrink-0"
            >
              <option value="all">{isAr ? 'كل حالات Face ID' : 'All Face ID'}</option>
              <option value="yes">{isAr ? '⚡ Face ID مفعل' : 'Face ID Enrolled'}</option>
              <option value="no">{isAr ? 'Face ID غير مفعل' : 'Face ID Inactive'}</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={auditStatusFilter}
              onChange={(e) => setAuditStatusFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold outline-none shrink-0"
            >
              <option value="all">{isAr ? 'كل العمليات' : 'All Status'}</option>
              <option value="success">{isAr ? '✓ ناجحة فقط' : 'Successful Only'}</option>
              <option value="failed">{isAr ? '✗ فاشلة فقط' : 'Failed Only'}</option>
            </select>

            <select
              value={auditMethodFilter}
              onChange={(e) => setAuditMethodFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold outline-none shrink-0"
            >
              <option value="all">{isAr ? 'كل الطرق' : 'All Methods'}</option>
              <option value="password">{isAr ? '🔑 كلمة المرور' : 'Password'}</option>
              <option value="face_id">{isAr ? '⚡ Face ID' : 'Face ID'}</option>
            </select>

            <button
              type="button"
              onClick={handleRefreshAudits}
              disabled={refreshingAudits}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold transition-colors shrink-0"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${refreshingAudits ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── TAB 1: STUDENT CREDENTIALS HUB ─────────────────────────────────── */}
      {activeTab === 'credentials' && (
        <Card className="border shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>{isAr ? 'بيانات دخول الطلاب' : 'Student Login Accounts'}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr
                    ? 'عرض بيانات تسجيل الدخول، إرسالها للواتساب، وإعادة تعيين كلمة المرور أو فرض تغييرها عند الدخول.'
                    : 'View login info, dispatch credentials via WhatsApp, and manage password reset & Face ID.'}
                </CardDescription>
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {filteredStudents.length} / {students.length} {isAr ? 'طالب' : 'students'}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <KeyRound className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-bold text-muted-foreground">
                  {isAr ? 'لا توجد حسابات مطابقة لمعايير البحث' : 'No student credentials found'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-x-auto">
                <table className="w-full text-start text-xs sm:text-sm">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 text-start">{isAr ? 'الطالب' : 'Student'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'كود الدخول' : 'Student Code'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'الهاتف / واتساب' : 'Phone'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'حالة كلمة المرور' : 'Password Status'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'بصمة الوجه (Face ID)' : 'Face ID'}</th>
                      <th className="py-3 px-4 text-end">{isAr ? 'إجراءات سريعة' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        {/* Student Name */}
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div>
                            <p className="text-sm font-bold">{s.fullName}</p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px]">
                              {s.email}
                            </p>
                          </div>
                        </td>

                        {/* Student Code */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                            {s.studentCode}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4">
                          {s.phone || s.parentPhone ? (
                            <div className="space-y-0.5">
                              {s.phone && (
                                <p className="font-mono text-xs text-foreground font-medium">
                                  {s.phone}
                                </p>
                              )}
                              {s.parentPhone && s.parentPhone !== s.phone && (
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {isAr ? 'ولي الأمر:' : 'Parent:'} {s.parentPhone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Password State Badge */}
                        <td className="py-3.5 px-4">
                          {s.mustChangePassword ? (
                            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-[11px] font-bold">
                              ⚠️ {isAr ? 'مطلوب تغييرها عند الدخول' : 'Change Required'}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 text-[11px] font-semibold"
                            >
                              ✓ {isAr ? 'مستقرة ومحدثة' : 'Normal / Set'}
                            </Badge>
                          )}
                        </td>

                        {/* Face ID Badge */}
                        <td className="py-3.5 px-4">
                          {s.hasFaceId ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                ⚡ {isAr ? 'مفعل' : 'Active'}
                              </span>
                              <button
                                type="button"
                                title={isAr ? 'إلغاء تفعيل Face ID' : 'Revoke Face ID'}
                                onClick={() => setRevokeFaceIdStudent(s)}
                                className="text-muted-foreground hover:text-red-500 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs font-medium">
                              {isAr ? 'غير مفعل' : 'Not enrolled'}
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Full Credentials */}
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(s)}
                              title={isAr ? 'نسخ بيانات الدخول للواتساب' : 'Copy credentials'}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold transition-all shadow-xs"
                            >
                              {copiedId === s.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span>{copiedId === s.id ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}</span>
                            </button>

                            {/* WhatsApp Direct Link */}
                            {(s.phone || s.parentPhone) && (
                              <a
                                href={getWhatsAppHref(s)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={isAr ? 'إرسال البيانات عبر واتساب' : 'Send via WhatsApp'}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-xs"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </a>
                            )}

                            {/* Reset Password Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudent(s)
                                setNewPassword('Student@123456')
                                setRequireChangeOnLogin(true)
                                setResetDialogOpen(true)
                              }}
                              title={isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-colors shadow-xs"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              <span>{isAr ? 'تعيين' : 'Reset'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: LOGIN AUDIT LOG ─────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <Card className="border shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-500" />
                  <span>{isAr ? 'سجل عمليات الدخول والمحاولات (Live Audit)' : 'Session Audit Logs'}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr
                    ? 'تسجيل دقيق لكل محاولة دخول بالوقت، كود الطالب، الطريقة (كلمة مرور أو Face ID)، وحالة النجاح أو سبب الفشل.'
                    : 'Real-time log of every student and teacher sign in attempt with device and status details.'}
                </CardDescription>
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {filteredAudits.length} {isAr ? 'سجل' : 'events'}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredAudits.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <History className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-bold text-muted-foreground">
                  {isAr ? 'لا توجد سجلات دخول مطابقة' : 'No audit records match the filters'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-x-auto">
                <table className="w-full text-start text-xs sm:text-sm">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 text-start">{isAr ? 'التوقيت' : 'Time'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'المعرّف / كود الطالب' : 'Student / Identifier'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'طريقة الدخول' : 'Method'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'النتيجة' : 'Status'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'تفاصيل / جهاز الدخول' : 'Device & Details'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAudits.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(a.at).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        {/* Student / Identifier */}
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">
                              {a.studentCode || a.identifier}
                            </span>
                            {a.studentName && (
                              <span className="text-xs font-semibold">{a.studentName}</span>
                            )}
                          </div>
                        </td>

                        {/* Method */}
                        <td className="py-3.5 px-4">
                          {a.method === 'face_id' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                              <ScanFace className="h-3.5 w-3.5" />
                              <span>Face ID</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                              <KeyRound className="h-3.5 w-3.5" />
                              <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {a.success ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold">
                              ✓ {isAr ? 'دخول ناجح' : 'Success'}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs font-bold">
                              ✗ {isAr ? 'فشل الدخول' : 'Failed'}
                            </Badge>
                          )}
                        </td>

                        {/* Device / Details */}
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          <div>
                            {a.failureReason && (
                              <p className="text-red-500 font-semibold">{a.failureReason}</p>
                            )}
                            {a.userAgent && (
                              <p className="truncate max-w-[260px] text-[11px] opacity-75">
                                {a.userAgent}
                              </p>
                            )}
                            {!a.failureReason && !a.userAgent && <span>—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── DIALOG: TEACHER RESET STUDENT PASSWORD ──────────────────────────── */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <span>{isAr ? 'إعادة تعيين كلمة مرور الطالب' : 'Reset Student Password'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? `تحديد كلمة مرور جديدة للطالب (${selectedStudent?.fullName} - ${selectedStudent?.studentCode}).`
                : `Set a new password for student (${selectedStudent?.fullName} - ${selectedStudent?.studentCode}).`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                dir="ltr"
              />
              <p className="text-[11px] text-muted-foreground">
                {isAr ? 'القيمة المقترحة: Student@123456' : 'Default suggested: Student@123456'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border bg-amber-500/10 border-amber-500/20 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireChangeOnLogin}
                  onChange={(e) => setRequireChangeOnLogin(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    {isAr
                      ? 'إلزام الطالب بتغيير كلمة المرور فور تسجيل الدخول'
                      : 'Force student to change password on next sign in'}
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    {isAr
                      ? 'سيتم توجيه الطالب مباشرة لصفحة تعيين كلمة مروره الشخصية ولن يتمكن من دخول المنصة قبل تغييرها.'
                      : 'Student will be redirected to choose their own personal password before accessing portal.'}
                  </p>
                </div>
              </label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <button
                type="button"
                onClick={() => setResetDialogOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-muted"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {resetLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isAr ? 'تأكيد وحفظ كلمة المرور' : 'Save & Enforce'}</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: REVOKE FACE ID ──────────────────────────────────────────── */}
      <Dialog
        open={!!revokeFaceIdStudent}
        onOpenChange={(open) => !open && setRevokeFaceIdStudent(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>{isAr ? 'إلغاء تفعيل بصمة الوجه (Face ID)' : 'Revoke Face ID Enrollment'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? `هل أنت متأكد من إلغاء ربط Face ID للطالب (${revokeFaceIdStudent?.fullName} - ${revokeFaceIdStudent?.studentCode})؟ سيتعين على الطالب تفعيلها مجدداً بكلمة المرور.`
                : `Are you sure you want to revoke Face ID for (${revokeFaceIdStudent?.fullName} - ${revokeFaceIdStudent?.studentCode})?`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setRevokeFaceIdStudent(null)}
              className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-muted"
            >
              {isAr ? 'تراجع' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleRevokeFaceId}
              disabled={revokeLoading}
              className="px-5 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 flex items-center justify-center gap-2"
            >
              {revokeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isAr ? 'تأكيد الإلغاء' : 'Confirm Revoke'}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
