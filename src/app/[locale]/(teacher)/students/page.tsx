import { requireTeacher } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StudentsClientView, StudentListItem } from './StudentsClientView'

interface StudentQueryResult {
  id: string
  student_code: string
  phone: string | null
  parent_phone: string | null
  email: string | null
  status: 'active' | 'inactive' | 'archived'
  enrolled_on: string
  profiles: {
    full_name: string
  } | null
  enrollments: Array<{
    class_id: string
    classes: {
      id: string
      name: string
    } | null
  }> | null
}

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireTeacher(locale)

  const supabase = await createClient()

  // 1. Fetch all students with profile & active enrollments
  const { data: rawStudents, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      student_code,
      phone,
      parent_phone,
      email,
      status,
      enrolled_on,
      profiles (
        full_name
      ),
      enrollments (
        class_id,
        classes (
          id,
          name
        )
      )
    `)
    .order('student_code', { ascending: true })

  if (studentsError) {
    console.error('Error fetching students:', studentsError)
  }

  // 2. Fetch active classes
  const { data: rawClasses, error: classesError } = await supabase
    .from('classes')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (classesError) {
    console.error('Error fetching classes:', classesError)
  }

  // Format students list
  const students: StudentListItem[] = (rawStudents as unknown as StudentQueryResult[] || []).map((s) => ({
    id: s.id,
    student_code: s.student_code,
    full_name: s.profiles?.full_name || 'Unnamed Student',
    phone: s.phone,
    parent_phone: s.parent_phone,
    email: s.email,
    status: s.status,
    enrolled_on: s.enrolled_on,
    classes: (s.enrollments || [])
      .filter((e) => e.classes !== null)
      .map((e) => ({
        id: e.classes!.id,
        name: e.classes!.name,
      })),
  }))

  const classes = ((rawClasses as any[]) || []).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <StudentsClientView initialStudents={students} classes={classes} />
    </div>
  )
}
