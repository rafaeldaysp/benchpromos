import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'

import { BenchmarkExplorer } from '@/components/benchmarks/benchmark-explorer'
import { ProductSelect } from '@/components/benchmarks/product-select'
import { Separator } from '@/components/ui/separator'
import { type Benchmark, type Product } from '@/types'

const GET_BENCHMARKS = gql`
  query GetBenchmarks(
    $getBenchmarksInput: GetBenchmarksInput
    $getProductsInput: GetProductsInput
  ) {
    benchmarks(getBenchmarksInput: $getBenchmarksInput) {
      id
      name
      slug
      childrenCount
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
    benchmarks: (Benchmark & { childrenCount: number })[]
    productsList: {
      products: (Pick<Product, 'name' | 'slug' | 'imageUrl'> & {
        category: { name: string }
        subcategory: { name: string }
      })[]
    }
  }>({
    query: GET_BENCHMARKS,
    variables: {
      getBenchmarksInput: {
        parentId: null,
      },
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
          {benchmarks.length > 0 && <BenchmarkExplorer root={benchmarks} />}
        </aside>
        {children}
      </div>
    </div>
  )
}
