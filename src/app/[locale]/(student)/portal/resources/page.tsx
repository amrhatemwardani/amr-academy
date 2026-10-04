import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ExternalLink, BookOpen, FolderOpen, Layers } from 'lucide-react'

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const user = await requireStudent(locale)
  const isAr = locale === 'ar'
  const admin = createAdminClient()

  // Get enrolled class IDs
  const { data: enrollments } = await (admin.from('enrollments' as any) as any)
    .select('class_id')
    .eq('student_id', user.id)
    .is('left_on', null)
  const classIds: string[] = (enrollments as any[] || []).map((e: any) => e.class_id)

  // Fetch materials for enrolled classes or global materials
  let query = (admin.from('materials' as any) as any)
    .select('id, title, section, chapter, drive_url, class_id, description, sort_order, classes(name)')
    .eq('is_active', true)
    .order('section')
    .order('sort_order')
    .order('created_at')

  if (classIds.length > 0) {
    query = query.or(`class_id.in.(${classIds.join(',')}),class_id.is.null`)
  } else {
    query = query.is('class_id', null)
  }

  const { data: materials } = await query
  const allMaterials: any[] = materials || []

  // Group by section then chapter
  const sections = new Map<string, Map<string, any[]>>()
  for (const m of allMaterials) {
    if (!sections.has(m.section)) sections.set(m.section, new Map())
    const sMap = sections.get(m.section)!
    const chapterKey = m.chapter || '_root'
    if (!sMap.has(chapterKey)) sMap.set(chapterKey, [])
    sMap.get(chapterKey)!.push(m)
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{isAr ? 'المواد الدراسية' : 'Study Materials'}</h1>
            <p className="text-blue-100 text-sm">{isAr ? 'كل محتوى دروسك منظم بالفصول' : 'All your lesson content organized by chapters'}</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-blue-200">
          {allMaterials.length} {isAr ? 'مادة متاحة' : 'materials available'}
        </div>
      </div>

      {sections.size === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-muted-foreground">{isAr ? 'لا توجد مواد بعد' : 'No materials posted yet'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? 'سيقوم أستاذك بإضافة المحتوى قريباً' : 'Your teacher will add content soon'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(sections.entries()).map(([section, chaptersMap]) => (
            <div key={section} className="border border-border rounded-2xl overflow-hidden bg-card">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border-b px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-base">{section}</h2>
                  <p className="text-xs text-muted-foreground">
                    {Array.from(chaptersMap.values()).flat().length} {isAr ? 'مادة' : 'materials'}
                  </p>
                </div>
              </div>

              {/* Chapters and Materials */}
              <div className="p-4 space-y-4">
                {Array.from(chaptersMap.entries()).map(([chapter, items]) => (
                  <div key={chapter}>
                    {chapter !== '_root' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-xs font-semibold text-muted-foreground px-2">{chapter}</span>
                        <div className="h-px bg-border flex-1" />
                      </div>
                    )}
                    <div className="grid gap-2">
                      {items.map((m: any) => (
                        <a
                          key={m.id}
                          href={m.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                            <FolderOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{m.title}</p>
                            {m.description && (
                              <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                            )}
                            {m.classes?.name && (
                              <span className="text-[10px] text-muted-foreground">{m.classes.name}</span>
                            )}
                          </div>
                          <ExternalLink className="h-4 w-4 text-blue-500 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
