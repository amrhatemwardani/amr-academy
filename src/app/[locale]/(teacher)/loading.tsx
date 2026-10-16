import { BrandedLoader } from '@/components/ui/BrandedLoader'

export default function TeacherLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center py-4">
        <BrandedLoader size="sm" showText={false} />
      </div>
      <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded-lg bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-muted" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded-md bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
            <div className="h-8 w-16 rounded-md bg-muted" />
            <div className="h-3 w-20 rounded-md bg-muted" />
          </div>
        ))}
      </div>

      {/* Table / content skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="h-5 w-36 rounded-md bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 rounded-md bg-muted" />
                <div className="h-3 w-24 rounded-md bg-muted" />
              </div>
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  )
}
