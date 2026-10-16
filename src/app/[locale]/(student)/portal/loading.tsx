import { BrandedLoader } from '@/components/ui/BrandedLoader'

export default function StudentLoading() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-20">
      <div className="flex justify-center py-4">
        <BrandedLoader size="sm" showText={false} />
      </div>
      <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="space-y-2 pt-2">
        <div className="h-7 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-64 rounded-lg bg-muted" />
      </div>

      {/* Card skeletons */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 rounded-md bg-muted" />
              <div className="h-3 w-24 rounded-md bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded-md bg-muted" />
            <div className="h-3 w-4/5 rounded-md bg-muted" />
            <div className="h-3 w-3/5 rounded-md bg-muted" />
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}
