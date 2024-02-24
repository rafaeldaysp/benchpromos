import { Skeleton } from '@/components/ui/skeleton'

export function BlogSkeleton() {
  return (
    <div className="px-4 py-10 sm:container">
      <div className="space-y-4">
        <Skeleton className="h-9 w-[300px] rounded-lg" />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl sm:h-[500px]" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BlogLoading() {
  return <BlogSkeleton />
}
