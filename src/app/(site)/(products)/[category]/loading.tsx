import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return <ProductsSkeleton />
}

export function ProductsSkeleton() {
  return (
    <div className="px-4 py-10 sm:container">
      <div className="space-y-6">
        <div className="flex gap-x-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-sm" />
          ))}
        </div>
        <Separator />

        <div className="flex lg:justify-between">
          <div className="flex flex-1 items-center justify-between gap-x-4 lg:justify-normal">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-40 rounded-sm" />
          </div>
          <div className="hidden items-center gap-x-4 lg:flex">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-20 rounded-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 justify-center gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-52 w-full rounded-xl sm:h-96 sm:w-60"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
