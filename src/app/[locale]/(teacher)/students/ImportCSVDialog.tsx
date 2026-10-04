'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileDown, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import Papa from 'papaparse'
import { importStudentsAction } from './actions'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'

interface ClassItem {
  id: string
  name: string
}

interface ImportCSVDialogProps {
  classes: ClassItem[]
  onSuccess?: () => void
}

interface ParsedRow {
  fullName: string
  phone?: string
  parentPhone?: string
  className?: string
  classId?: string
}

export function ImportCSVDialog({ classes, onSuccess }: ImportCSVDialogProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importResults, setImportResults] = useState<{
    total: number
    created: number
    failed: number
    students: Array<{ code: string; name: string; password: string }>
  } | null>(null)

  const reset = () => {
    setParsedRows([])
    setError(null)
    setImportResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownloadTemplate = () => {
    const csvContent =
      'Full Name,Phone,Parent Phone,Class\n' +
      'Youssef Amr,01012345678,01087654321,Mathematics - Grade 10\n' +
      'Mariam Tarek,01112345678,01187654321,Physics - Grade 11\n'

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'students_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError(isAr ? 'الملف فارغ أو غير صالح' : 'File is empty or invalid')
          return
        }

        const rows: ParsedRow[] = results.data.map((r) => {
          // Normalize header names
          const name = r['Full Name'] || r['Name'] || r['اسم الطالب'] || r['الاسم'] || Object.values(r)[0] || ''
          const phone = r['Phone'] || r['Phone Number'] || r['الهاتف'] || r['رقم الهاتف'] || ''
          const parent = r['Parent Phone'] || r['ولي الأمر'] || r['هاتف ولي الأمر'] || ''
          const cName = r['Class'] || r['Class Name'] || r['الفصل'] || ''

          // Match class ID if class name matches
          const matchedClass = classes.find(
            (c) => c.name.toLowerCase() === cName.trim().toLowerCase()
          )

          return {
            fullName: name.trim(),
            phone: phone.trim() || undefined,
            parentPhone: parent.trim() || undefined,
            className: cName.trim() || undefined,
            classId: matchedClass?.id,
          }
        }).filter((r) => r.fullName.length > 0)

        if (rows.length === 0) {
          setError(isAr ? 'لم يتم العثور على صفوف صالحة' : 'No valid rows found')
          return
        }

        setParsedRows(rows)
      },
      error: (err) => {
        setError(err.message)
      },
    })
  }

  const handleStartImport = async () => {
    if (parsedRows.length === 0) return

    try {
      setLoading(true)
      const res = await importStudentsAction(
        parsedRows.map((r) => ({
          fullName: r.fullName,
          phone: r.phone,
          parentPhone: r.parentPhone,
          classId: r.classId,
        })),
        locale
      )

      setImportResults(res)
      toast.success(
        isAr
          ? `تم استيراد ${res.created} من أصل ${res.total} طالب`
          : `Successfully imported ${res.created} of ${res.total} students`
      )
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          <span>{isAr ? 'استيراد CSV' : 'Import CSV'}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <span>{isAr ? 'استيراد الطلاب دفعة واحدة (CSV)' : 'Batch Import Students (CSV)'}</span>
          </DialogTitle>
        </DialogHeader>

        {importResults ? (
          <div className="space-y-4 py-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  {isAr ? 'اكتمل الاستيراد بنجاح!' : 'Import Completed!'}
                </p>
                <p className="text-xs opacity-90">
                  {isAr
                    ? `تم إنشاء ${importResults.created} طالب بنجاح (فشل ${importResults.failed})`
                    : `Created ${importResults.created} students (${importResults.failed} failed)`}
                </p>
              </div>
            </div>

            {importResults.students.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs text-start">
                  <thead className="bg-muted text-muted-foreground sticky top-0">
                    <tr>
                      <th className="p-2 text-start">Code</th>
                      <th className="p-2 text-start">Name</th>
                      <th className="p-2 text-start">Default Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {importResults.students.map((s) => (
                      <tr key={s.code}>
                        <td className="p-2 font-bold text-primary">{s.code}</td>
                        <td className="p-2 font-sans font-medium">{s.name}</td>
                        <td className="p-2">{s.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Template download card */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div className="text-xs">
                <p className="font-semibold">{isAr ? 'تحميل نموذج ملف Excel / CSV' : 'Download Sample CSV Template'}</p>
                <p className="text-muted-foreground text-[11px]">
                  {isAr ? 'استخدم الأعمدة: Full Name, Phone, Parent Phone, Class' : 'Includes columns: Full Name, Phone, Parent Phone, Class'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs shrink-0"
                onClick={handleDownloadTemplate}
              >
                <FileDown className="h-4 w-4" />
                <span>{isAr ? 'تحميل النموذج' : 'Template'}</span>
              </Button>
            </div>

            {/* File picker */}
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csvFileInput"
              />
              <label
                htmlFor="csvFileInput"
                className="cursor-pointer flex flex-col items-center gap-2 text-xs"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="font-semibold text-sm">
                  {isAr ? 'اضغط لاختيار ملف CSV من جهازك' : 'Click to choose a CSV file'}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {isAr ? 'يقبل ملفات .csv المرمزة بـ UTF-8' : 'Supports UTF-8 encoded .csv files'}
                </span>
              </label>
            </div>

            {/* Preview table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold">
                  {isAr ? `معاينة البيانات (${parsedRows.length} طالب):` : `Preview (${parsedRows.length} students):`}
                </p>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-muted text-muted-foreground sticky top-0">
                      <tr>
                        <th className="p-2 text-start">#</th>
                        <th className="p-2 text-start">{isAr ? 'الاسم' : 'Name'}</th>
                        <th className="p-2 text-start">{isAr ? 'الهاتف' : 'Phone'}</th>
                        <th className="p-2 text-start">{isAr ? 'الفصل' : 'Class'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedRows.slice(0, 10).map((r, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-muted-foreground">{idx + 1}</td>
                          <td className="p-2 font-medium">{r.fullName}</td>
                          <td className="p-2 font-mono text-[11px]">{r.phone || '-'}</td>
                          <td className="p-2 text-muted-foreground">{r.className || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 10 && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    {isAr
                      ? `... والمزيد (${parsedRows.length - 10} طلاب آخرين)`
                      : `... and ${parsedRows.length - 10} more`}
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                disabled={parsedRows.length === 0 || loading}
                loading={loading}
                onClick={handleStartImport}
              >
                {isAr
                  ? `بدء الاستيراد (${parsedRows.length} طالب)`
                  : `Start Import (${parsedRows.length})`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
