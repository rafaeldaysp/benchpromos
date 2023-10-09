import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'

import { BenchmarkSelect } from '@/components/benchmarks/benchmark-select'
import { ProductSelect } from '@/components/benchmarks/product-select'
import { Separator } from '@/components/ui/separator'
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

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default async function BenchmarksLayout({
  children,
}: SettingsLayoutProps) {
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

  const benchmarks = data?.benchmarks ?? []
  const products = data?.productsList.products ?? []

  return (
    <div className="space-y-6 px-4 py-8 sm:container">
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
          {benchmarks.length > 0 && <BenchmarkSelect benchmarks={benchmarks} />}
        </aside>
        {children}
      </div>
    </div>
  )
}
