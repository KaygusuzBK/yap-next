export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-64 rounded-md bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4 space-y-3 md:col-span-2">
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          <div className="h-2 w-full bg-muted rounded animate-pulse" />
          <div className="h-2 w-11/12 bg-muted rounded animate-pulse" />
          <div className="h-2 w-10/12 bg-muted rounded animate-pulse" />
          <div className="h-64 w-full bg-muted rounded animate-pulse" />
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-full bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
