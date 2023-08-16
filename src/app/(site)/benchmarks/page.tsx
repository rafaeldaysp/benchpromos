import { gql } from '@apollo/client'

import { BenchmarkChart } from '@/components/benchmark-chart'
import { getClient } from '@/lib/apollo'
import type { Benchmark, BenchmarkResult, Product } from '@/types'

const GET_BENCHMARKS = gql`
  query GetBenchmarks {
    benchmarks {
      id
      name
      results {
        result
        description
        product {
          name
        }
      }
    }
  }
`

export default async function BenchmarksPage() {
  const { data } = await getClient().query<{
    benchmarks: (Benchmark & {
      results: (Pick<BenchmarkResult, 'result' | 'description'> & {
        product: Pick<Product, 'name'>
      })[]
    })[]
  }>({
    query: GET_BENCHMARKS,
  })

  const benchmarks = data?.benchmarks

  return (
    <div className="mx-auto px-4 py-10 sm:container">
      <BenchmarkChart benchmarks={benchmarks} />
    </div>
  )
}
