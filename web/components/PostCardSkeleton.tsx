export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-md border border-ink-200/70 overflow-hidden">
      <div className="aspect-square bg-ink-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-ink-100 rounded animate-pulse" />
        <div className="h-3 bg-ink-100 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-ink-100 rounded w-1/2 animate-pulse mt-3" />
      </div>
    </div>
  );
}
