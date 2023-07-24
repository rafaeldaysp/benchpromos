import { getClient } from '@/lib/apollo'
import { type Benchmark, type BenchmarkResult, type Product } from '@/types'
import { gql } from '@apollo/client'
import { BenchmarksMain } from './main'
import { Separator } from '@/components/ui/separator'

const GET_BENCHMARKS_AND_PRODUCTS = gql`
  query GetBenchmarksAndProducts {
    benchmarks {
      id
      name
      results {
        result
        product {
          id
          name
        }
      }
    }
    products {
      id
      name
    }
  }
`

export default async function BenchmarksDashboardPageAux() {
  const response = await getClient().query<{
    benchmarks: (Benchmark &
      (BenchmarkResult & Pick<Product, 'id' | 'name'>)[])[]
    products: Pick<Product, 'id' | 'name'>
  }>({
    query: GET_BENCHMARKS_AND_PRODUCTS,
  })

  const benchmarks = response.data.benchmarks
  const products = response.data.products

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Benchmarks</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um benchmark.
        </p>
      </div>
      <Separator />
      <BenchmarksMain benchmarks={benchmarks} products={products} />
    </div>
  )
}
