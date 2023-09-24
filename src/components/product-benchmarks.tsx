import Link from 'next/link'

import { cn } from '@/lib/utils'
import { type Benchmark, type BenchmarkResult } from '@/types'
import { Icons } from './icons'
import { buttonVariants } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'

interface ProductBenchmarksProps {
  benchmarksResults: (Omit<BenchmarkResult, 'productId' | 'benchmarkId'> & {
    benchmark: Omit<Benchmark, 'id'>
  })[]
  productSlug: string
}

export function ProductBenchmarks({
  benchmarksResults,
  productSlug,
}: ProductBenchmarksProps) {
  return (
    <main className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {benchmarksResults.map((benchmarkResult) => (
        <Card key={benchmarkResult.id} className="h-full">
          <CardHeader>
            <CardTitle className="text-center text-sm font-medium">
              {benchmarkResult.benchmark.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <strong className="text-center text-2xl text-primary">
              {benchmarkResult.result}
            </strong>
          </CardContent>
          <CardFooter className="">
            <Link
              href={`/benchmarks/${benchmarkResult.benchmark.slug}?product=${productSlug}`}
              className={cn(
                buttonVariants({ variant: 'default' }),
                'w-full rounded-xl',
              )}
            >
              Comparações
              <Icons.ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </main>
  )
}
