import { gql } from '@apollo/client'

import { BenchmarkChart } from '@/components/benchmarks/benchmark-chart'
import { BenchmarkSelect } from '@/components/benchmarks/benchmark-select'
import { ProductSelect } from '@/components/benchmarks/product-select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { type Product } from '@/types'

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
    <div className="mx-auto space-y-6 px-4 py-8 sm:container">
      <div className="space-y-0.5">
        <h3 className="font-medium">Benchmarks</h3>
        <p className="text-sm text-muted-foreground">
          Selecione produtos e confira os benchmarks realizados pelo canal.
        </p>
      </div>
      <Separator />
      <div className="space-y-4 lg:grid lg:grid-cols-5 lg:space-x-12 lg:space-y-0">
        <aside className="space-y-4 sm:max-w-5xl">
          <ProductSelect products={products} />
          <Separator className="hidden lg:block" />
          <BenchmarkSelect
            benchmarks={benchmarks}
            selectedBenchmark={selectedBenchmark}
            selectedIndex={selectedIndex}
          />
        </aside>
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>
              <p className="text-center text-sm sm:text-base">
                {selectedBenchmark.name}
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pl-0 pt-0 sm:p-6 sm:px-8 sm:pt-0 lg:px-12">
            <BenchmarkChart targetProduct="Acer Nitro 5 Ryzen 7 6800H RTX 3070 Ti" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
