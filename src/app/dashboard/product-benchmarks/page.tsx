import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import { Separator } from '@/components/ui/separator'
import { BenchmarksMain } from './main'
import { type BenchmarkType } from './columns'

const GET_BENCHMARKS = gql`
  query GetBenchmarks {
    benchmarks: benchmarkResults {
      id
      benchmark {
        id
        name
      }
      product {
        id
        name
        imageUrl
      }
      description
      result
    }
  }
`

export default async function BenchmarksDashboardPageAux() {
  const benchmarks = await getBenchmarks()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Benchmarks</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um benchmark.
        </p>
      </div>
      <Separator />
      <BenchmarksMain benchmarks={benchmarks} />
    </div>
  )
}

export async function getBenchmarks() {
  const response = await getClient().query<{
    benchmarks: BenchmarkType[]
  }>({
    query: GET_BENCHMARKS,
  })

  const benchmarks = response.data.benchmarks

  return benchmarks
}
