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
    products {
      products {
        id
        name
      }
    }
    allBenchmarks: benchmarks {
      id
      name
    }
  }
`

export default async function BenchmarksDashboardPageAux() {
  const { benchmarks, allBenchmarks, products } = await getBenchmarks()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Benchmarks</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um benchmark.
        </p>
      </div>
      <Separator />
      <BenchmarksMain
        benchmarks={benchmarks}
        allBenchmarks={allBenchmarks}
        products={products}
      />
    </div>
  )
}

export async function getBenchmarks() {
  const response = await getClient().query<{
    benchmarks: BenchmarkType[]
    allBenchmarks: { id: string; name: string }[]
    products: { products: { id: string; name: string } }
  }>({
    query: GET_BENCHMARKS,
  })

  const benchmarks = response.data.benchmarks
  const products = response.data.products.products
  const allBenchmarks = response.data.allBenchmarks

  return {
    benchmarks,
    products,
    allBenchmarks,
  }
}
