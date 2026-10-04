import re

# Edit AssignmentsClientView.tsx
file_path = r"c:\Users\hp\Documents\Amr Acadmy\src\app\[locale]\(teacher)\assignments\AssignmentsClientView.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { createAssignmentAction, deleteAssignmentAction } from './actions'",
    "import { createAssignmentAction, deleteAssignmentAction, getQuestionsForPickerAction } from './actions'"
)

content = content.replace(
    "submissionCount: number\n  createdAt: string\n}",
    "submissionCount: number\n  createdAt: string\n  resource_link?: string | null\n}"
)

# Add states
content = content.replace(
    "const [maxScore, setMaxScore] = useState('100')",
    "const [maxScore, setMaxScore] = useState('100')\n  const [resourceLink, setResourceLink] = useState('')\n  const [pickerOpen, setPickerOpen] = useState(false)\n  const [pickerQs, setPickerQs] = useState<any[]>([])\n  const [selectedQs, setSelectedQs] = useState<Set<string>>(new Set())"
)

# Reset form
content = content.replace(
    "setMaxScore('100')\n    setError(null)",
    "setMaxScore('100')\n    setResourceLink('')\n    setError(null)"
)

# Create action call
content = content.replace(
    "maxScore: parseInt(maxScore) || 100,\n        },",
    "maxScore: parseInt(maxScore) || 100,\n          resource_link: resourceLink || undefined,\n        },"
)

# Description field update
desc_field_old = """            {/* Description */}
            <div className="space-y-1.5">
              <Label>{isAr ? 'التعليمات / الوصف والأسئلة' : 'Instructions & Questions'}</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder={isAr ? 'اكتب تفاصيل الواجب أو أرقام التمارين أو الأسئلة...' : 'Write assignment details, exercise numbers, or questions...'}
              />
            </div>"""

desc_field_new = """            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{isAr ? 'التعليمات / الوصف والأسئلة' : 'Instructions & Questions'}</Label>
                <Button type="button" variant="outline" size="sm" onClick={async () => {
                  const res = await getQuestionsForPickerAction()
                  setPickerQs(res.questions)
                  setSelectedQs(new Set())
                  setPickerOpen(true)
                }}>
                  {isAr ? 'استيراد من بنك الأسئلة' : 'Import from Question Bank'}
                </Button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder={isAr ? 'اكتب تفاصيل الواجب أو أرقام التمارين أو الأسئلة...' : 'Write assignment details, exercise numbers, or questions...'}
              />
            </div>
            
            {/* Resource Link */}
            <div className="space-y-1.5">
              <Label>{isAr ? 'رابط مصادر (اختياري)' : 'Resource Link (optional)'}</Label>
              <Input
                placeholder="Google Drive / YouTube link"
                value={resourceLink}
                onChange={(e) => setResourceLink(e.target.value)}
              />
            </div>"""
content = content.replace(desc_field_old, desc_field_new)

# Add Picker Dialog
picker_dialog = """
      {/* Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? 'بنك الأسئلة' : 'Question Bank'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
            {pickerQs.map(q => (
              <label key={q.id} className="flex items-start gap-2 p-2 border rounded hover:bg-muted/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQs.has(q.id)}
                  onChange={(e) => {
                    const next = new Set(selectedQs)
                    if (e.target.checked) next.add(q.id)
                    else next.delete(q.id)
                    setSelectedQs(next)
                  }}
                  className="mt-1"
                />
                <span className="text-sm">{q.body}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => {
              const selected = pickerQs.filter(q => selectedQs.has(q.id))
              if (selected.length > 0) {
                const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ${i + 1}. ).join('\\n')
                setDescription(prev => prev + qText)
              }
              setPickerOpen(false)
            }}>Import Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
"""

content = content.replace("</Dialog>\n    </div>", f"</Dialog>\n{picker_dialog}\n    </div>")

# Add resource link icon on card
card_title_old = """<p className="font-semibold text-sm text-foreground truncate">{a.title}</p>"""
card_title_new = """<div className="flex items-center gap-1"><p className="font-semibold text-sm text-foreground truncate">{a.title}</p>
{a.resource_link && (
  <a href={a.resource_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600" title="Resource Link">
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
  </a>
)}</div>"""
content = content.replace(card_title_old, card_title_new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Edit 1 done.")
