import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import type { Benchmark, BenchmarkResult, Product } from '@/types'
import { BenchmarksMain } from './main'

const GET_BENCHMARKS = gql`
  query GetBenchmarks($pagination: PaginationInput) {
    benchmarks {
      id
      name
      slug
      parentId
    }
    results(pagination: $pagination) {
      count
      list {
        id
        result
        unit
        productAlias
        description
        products {
          id
          name
          slug
          imageUrl
        }
        benchmark {
          id
          name
        }
      }
    }
  }
`
interface BenchmarksProps {
  searchParams: {
    page: string
    limit: string
  }
}

export default async function BenchmarksDashboardPage({
  searchParams,
}: BenchmarksProps) {
  const { page, limit } = searchParams

  const { data } = await getClient().query<{
    benchmarks: Benchmark[]
    results: {
      count: number
      list: (Omit<BenchmarkResult, 'benchmarkId'> & {
        products: Pick<Product, 'id' | 'name' | 'imageUrl' | 'slug'>[]
        benchmark: Benchmark
      })[]
    }
  }>({
    query: GET_BENCHMARKS,
    variables: {
      pagination: {
        page: Number(page ?? 1),
        limit: Number(limit ?? 10),
      },
    },
  })
  const benchmarks = data.benchmarks
  const results = data.results

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Benchmarks</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um benchmark.
        </p>
      </div>
      <Separator />
      <BenchmarksMain benchmarks={benchmarks} results={results} />
    </div>
  )
}
