import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import type { Benchmark, BenchmarkResult, Product } from '@/types'
import { BenchmarksMain } from './main'

const GET_BENCHMARKS_AND_PRODUCTS = gql`
  query GetBenchmarksAndProducts {
    benchmarks {
      id
      name
      results {
        id
        result
        description
        product {
          id
          name
          imageUrl
        }
      }
    }
    productsList: products {
      products {
        id
        name
        imageUrl
      }
    }
  }
`

export default async function BenchmarksDashboardPage() {
  const { data } = await getClient().query<{
    benchmarks: (Benchmark & {
      results: (Pick<BenchmarkResult, 'id' | 'result' | 'description'> & {
        product: Pick<Product, 'id' | 'name' | 'imageUrl'>
      })[]
    })[]
    productsList: {
      products: Pick<Product, 'id' | 'name' | 'imageUrl'>[]
    }
  }>({
    query: GET_BENCHMARKS_AND_PRODUCTS,
  })

  const benchmarks = data.benchmarks
  const products = data.productsList.products

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