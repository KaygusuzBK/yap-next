export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="h-4 w-36 bg-muted rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-2 w-full bg-muted rounded animate-pulse" />
            <div className="h-2 w-5/6 bg-muted rounded animate-pulse" />
            <div className="h-2 w-4/6 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}


