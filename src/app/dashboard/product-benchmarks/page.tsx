import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import { Separator } from '@/components/ui/separator'
import { BenchmarksMain } from './main'
import { type BenchmarkType } from '../../../components/data-table/columns'
import { type Product } from '@/types'
import { removeNullValues } from '@/utils'

const GET_BENCHMARKS_AND_PRODUCTS = gql`
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
        imageUrl
      }
    }
    allBenchmarks: benchmarks {
      id
      name
      results {
        id
      }
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
    allBenchmarks: { id: string; name: string; results: { id: string }[] }[]
    products: { products: Pick<Product, 'id' | 'name' | 'imageUrl'>[] }
  }>({
    query: GET_BENCHMARKS_AND_PRODUCTS,
    variables: { hasResults: true },
  })

  const benchmarks = response.data.benchmarks.map((benchmark) =>
    removeNullValues(benchmark),
  )
  const products = response.data.products.products
  const allBenchmarks = response.data.allBenchmarks

  return {
    benchmarks,
    products,
    allBenchmarks,
  }
}
