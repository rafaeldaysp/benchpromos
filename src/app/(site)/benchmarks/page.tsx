import { gql } from '@apollo/client'

import { BenchmarkChart } from '@/components/benchmarks/benchmark-chart'
import { BenchmarkSelect } from '@/components/benchmarks/benchmark-select'
import { ProductSelect } from '@/components/benchmarks/product-select'
import { getClient } from '@/lib/apollo'
import { type Product } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const GET_BENCHMARKS = gql`
  query GetBenchmarks(
    $hasResults: Boolean
    $getProductsInput: GetProductsInput
  ) {
    benchmarks(hasResults: $hasResults) {
      name
      slug
    }
    productsList: products(getProductsInput: $getProductsInput) {
      products {
        name
        imageUrl
        slug
        category {
          name
        }
        subcategory {
          name
        }
      }
    }
  }
`

interface BenchmarksPageProps {
  searchParams: {
    benchmark: string
  }
}

export default async function BenchmarksPage({
  searchParams,
}: BenchmarksPageProps) {
  const { benchmark } = searchParams

  const { data } = await getClient().query<{
    benchmarks: { name: string; slug: string }[]
    productsList: {
      products: (Pick<Product, 'name' | 'slug' | 'imageUrl'> & {
        category: { name: string }
        subcategory: { name: string }
      })[]
    }
  }>({
    query: GET_BENCHMARKS,
    variables: {
      hasResults: true,
      getProductsInput: {
        hasBenchmark: true,
        sortBy: 'relevance',
      },
    },
    errorPolicy: 'all',
  })

  const benchmarks = data?.benchmarks
  const products = data?.productsList.products ?? []
  const selectedBenchmark =
    benchmarks.find((b) => b.slug === benchmark) ?? benchmarks[0]
  const selectedIndex = benchmarks.indexOf(selectedBenchmark)

  return (
    <div className="mx-auto space-y-4 px-4 py-10 sm:container">
      <ProductSelect products={products} />
      <BenchmarkSelect
        benchmarks={benchmarks}
        selectedBenchmark={selectedBenchmark}
        selectedIndex={selectedIndex}
      />
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>
            <p className="text-center">{selectedBenchmark.name}</p>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <BenchmarkChart />
        </CardContent>
      </Card>
    </div>
  )
}
