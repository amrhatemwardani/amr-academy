'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import {
  Plus, Search, ExternalLink, Trash2, Pencil, BookOpen, FolderOpen, X, BookMarked, GraduationCap
} from 'lucide-react'
import { createMaterialAction, updateMaterialAction, deleteMaterialAction } from './actions'
import { toast } from 'sonner'

interface Material {
  id: string; title: string; section: string; chapter: string | null;
  drive_url: string; class_id: string | null; description: string | null;
  is_active: boolean; sort_order: number; created_at: string;
  classes: { name: string } | null
}

interface ClassOption { id: string; name: string }

export function MaterialsClientView({
  materials: initialMaterials,
  classes,
  locale,
}: {
  materials: Material[]
  classes: ClassOption[]
  locale: string
}) {
  const isAr = locale === 'ar'
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [editMaterial, setEditMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: '', section: '', chapter: '', drive_url: '',
    class_id: '', description: '', sort_order: '0'
  })

  const resetForm = () => setForm({ title: '', section: '', chapter: '', drive_url: '', class_id: '', description: '', sort_order: '0' })

  const openCreate = () => { resetForm(); setEditMaterial(null); setOpen(true) }
  const openEdit = (m: Material) => {
    setForm({
      title: m.title, section: m.section, chapter: m.chapter || '',
      drive_url: m.drive_url, class_id: m.class_id || '',
      description: m.description || '', sort_order: String(m.sort_order)
    })
    setEditMaterial(m)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.section.trim() || !form.drive_url.trim()) {
      toast.error(isAr ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields')
      return
    }
    setLoading(true)
    try {
      const data = {
        title: form.title, section: form.section, chapter: form.chapter || undefined,
        drive_url: form.drive_url, class_id: form.class_id || null,
        description: form.description || undefined, sort_order: parseInt(form.sort_order) || 0
      }
      const res = editMaterial
        ? await updateMaterialAction(editMaterial.id, data, locale)
        : await createMaterialAction(data, locale)
      if (res.success) {
        toast.success(editMaterial
          ? (isAr ? 'تم تحديث المادة' : 'Material updated')
          : (isAr ? 'تم إضافة المادة' : 'Material added'))
        setOpen(false)
        window.location.reload()
      } else {
        toast.error(res.error || 'Error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من الحذف؟' : 'Delete this material?')) return
    const res = await deleteMaterialAction(id, locale)
    if (res.success) { toast.success(isAr ? 'تم الحذف' : 'Deleted'); window.location.reload() }
    else toast.error(res.error || 'Error')
  }

  const filtered = useMemo(() => materials.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || m.title.toLowerCase().includes(q) || m.section.toLowerCase().includes(q)
    const matchClass = !filterClass || m.class_id === filterClass
    return matchSearch && matchClass
  }), [materials, search, filterClass])

  // Group by section
  const sections = useMemo(() => {
    const map = new Map<string, Material[]>()
    filtered.forEach(m => {
      if (!map.has(m.section)) map.set(m.section, [])
      map.get(m.section)!.push(m)
    })
    return map
  }, [filtered])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookMarked className="h-7 w-7 text-primary" />
            {isAr ? 'المواد الدراسية والمحتوى' : 'Study Materials'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? 'أضف روابط Google Drive لكل فصل ودرس' : 'Add Google Drive links organized by section & chapter'}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة مادة جديدة' : 'Add Material'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'ابحث في المواد...' : 'Search materials...'}
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="flex h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">{isAr ? 'كل الفصول' : 'All Classes'}</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Sections */}
      {sections.size === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{isAr ? 'لا توجد مواد بعد. أضف أول مادة!' : 'No materials yet. Add the first one!'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(sections.entries()).map(([section, items]) => (
            <div key={section} className="border rounded-xl overflow-hidden">
              <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-primary">{section}</h2>
                <span className="text-xs text-muted-foreground ml-auto">{items.length} {isAr ? 'مادة' : 'items'}</span>
              </div>
              <div className="divide-y">
                {items.map(m => (
                  <div key={m.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{m.title}</p>
                        {m.chapter && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-medium">
                            {m.chapter}
                          </span>
                        )}
                        {m.classes?.name && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {m.classes.name}
                          </span>
                        )}
                      </div>
                      {m.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" asChild>
                        <a href={m.drive_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          {isAr ? 'فتح' : 'Open'}
                        </a>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              {editMaterial
                ? (isAr ? 'تعديل المادة' : 'Edit Material')
                : (isAr ? 'إضافة مادة جديدة' : 'Add New Material')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>{isAr ? 'عنوان المادة *' : 'Title *'}</Label>
                <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder={isAr ? 'مثال: الفيزياء - الفصل الأول' : 'e.g. Physics Chapter 1'} required />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? 'القسم / الفصل *' : 'Section *'}</Label>
                <Input value={form.section} onChange={e => setForm(f => ({...f, section: e.target.value}))} placeholder={isAr ? 'الفصل الأول' : 'Chapter 1'} required />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? 'الدرس (اختياري)' : 'Chapter/Lesson (optional)'}</Label>
                <Input value={form.chapter} onChange={e => setForm(f => ({...f, chapter: e.target.value}))} placeholder={isAr ? 'الدرس الأول' : 'Lesson 1'} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{isAr ? 'رابط Google Drive *' : 'Google Drive URL *'}</Label>
                <Input value={form.drive_url} onChange={e => setForm(f => ({...f, drive_url: e.target.value}))} placeholder="https://drive.google.com/..." type="url" required />
                <p className="text-[11px] text-muted-foreground">{isAr ? 'الصق رابط المجلد أو الملف من Google Drive' : 'Paste any Google Drive folder or file share link'}</p>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{isAr ? 'الفصل الدراسي (اختياري)' : 'Class (optional)'}</Label>
                <select
                  value={form.class_id}
                  onChange={e => setForm(f => ({...f, class_id: e.target.value}))}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">{isAr ? 'كل الفصول' : 'All Classes'}</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{isAr ? 'وصف (اختياري)' : 'Description (optional)'}</Label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder={isAr ? 'وصف مختصر عن المحتوى...' : 'Brief description of content...'}
                  rows={2}
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? 'الترتيب' : 'Sort Order'}</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({...f, sort_order: e.target.value}))} min="0" />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '...' : editMaterial ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة' : 'Add Material')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
