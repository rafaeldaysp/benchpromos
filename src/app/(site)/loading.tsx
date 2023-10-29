import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return <SalesSkeleton />
}

export function SalesSkeleton() {
  return (
    <div className="px-4 py-10 sm:container">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl sm:h-[500px]" />
        ))}
      </div>
    </div>
  )
}
