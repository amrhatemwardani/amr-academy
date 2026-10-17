export interface CertificateData {
  id: string
  verificationCode: string
  studentId?: string
  studentName: string
  studentCode: string
  titleAr: string
  titleEn: string
  subtitleAr?: string
  subtitleEn?: string
  reasonAr?: string
  reasonEn?: string
  scoreText?: string
  issueDate: string
  instructorNameAr?: string
  instructorNameEn?: string
  academyNameAr?: string
  academyNameEn?: string
  verifyUrl: string
  badgeIcon?: string
}

export const DEFAULT_CERTIFICATE_TEMPLATES = [
  {
    id: 'physics_excellence',
    titleAr: 'شهادة تفوق وتميز في مادة الفيزياء',
    titleEn: 'Certificate of Excellence in Physics',
    subtitleAr: 'تقديراً للأداء الأكاديمي الاستثنائي وحصد أعلى الدرجات في امتحانات الفيزياء',
    subtitleEn: 'In recognition of outstanding academic performance and top scores in Physics',
    reasonAr: 'قد أظهر فهماً عميقاً واستيعاباً متميزاً للمفاهيم الفيزيائية وحل المسائل المتقدمة ببراعة واقتدار.',
    reasonEn: 'Demonstrated deep conceptual mastery and outstanding problem-solving skills in Physics.',
    icon: '⚡',
  },
  {
    id: 'full_mark',
    titleAr: 'شهادة الدرجة النهائية والكمال الأكاديمي',
    titleEn: 'Full Marks Academic Honors Certificate',
    subtitleAr: 'تقديراً للإجابة النموذجية والحصول على الدرجة النهائية كاملة (60 / 60)',
    subtitleEn: 'For achieving a perfect score (60 / 60) in the comprehensive examination',
    reasonAr: 'حقق الطالب الدرجة النهائية بنموذج إجابة مثالي يعكس أعلى درجات الدقة والتركيز والاجتهاد.',
    reasonEn: 'Achieved a perfect exam score demonstrating exceptional precision, diligence, and academic rigor.',
    icon: '💯',
  },
  {
    id: 'hall_of_fame_champion',
    titleAr: 'شهادة بطل لوحة الشرف والمركز الأول',
    titleEn: 'Hall of Fame Academic Champion',
    subtitleAr: 'لحصول الطالب على المركز الأول والريادة في قائمة الشرف العامة لهذا العام',
    subtitleEn: 'For ranking 1st place overall on the Official Academy Hall of Fame',
    reasonAr: 'تصدّر الطالب قائمة الشرف العامة على مستوى الدفعة متفوقاً في جميع الاختبارات والتقييمات الدورية.',
    reasonEn: 'Ranked 1st place across the entire cohort with consistent excellence across all evaluations.',
    icon: '🥇',
  },
  {
    id: 'attendance_dedication',
    titleAr: 'شهادة الالتزام والمواظبة الأكاديمية المثالية',
    titleEn: 'Honor Certificate for Dedication & Perfect Attendance',
    subtitleAr: 'تقديراً للحضور الكامل دون أي غياب وتسليم كافة الواجبات في مواعيدها المحددة',
    subtitleEn: 'For 100% attendance rate and timely submission of all coursework and exercises',
    reasonAr: 'أظهر الطالب التزاماً حديدياً وأخلاقاً علمية رفيعة بالمواظبة التامة على حضور الحصص وإنجاز المهام.',
    reasonEn: 'Exemplified supreme discipline and dedication through flawless attendance and punctual submissions.',
    icon: '🌟',
  },
]
