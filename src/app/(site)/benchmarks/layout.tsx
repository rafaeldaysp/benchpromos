import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import { type Metadata } from 'next'

import { getCurrentUser } from '@/app/_actions/user'
import { BenchmarkExplorer } from '@/components/benchmarks/benchmark-explorer'
import { BenchmarkFilters } from '@/components/benchmarks/benchmark-filters'
import { ProductSelect } from '@/components/benchmarks/product-select'
import { Separator } from '@/components/ui/separator'
import { type Benchmark, type Filter, type Product } from '@/types'

const GET_BENCHMARKS = gql`
  query GetBenchmarks(
    $getBenchmarksInput: GetBenchmarksInput
    $includeProductsWithBenchmarks: Boolean
  ) {
    benchmarks(getBenchmarksInput: $getBenchmarksInput) {
      id
      name
      slug
      childrenCount
    }
    categories(includeProductsWithBenchmarks: $includeProductsWithBenchmarks) {
      id
      name
      filters {
        name
        slug
        options {
          id
          slug
          priority
          value
        }
      }
      products {
        name
        imageUrl
        slug
        filters {
          option {
            id
            slug
            priority
          }
        }
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

export const metadata: Metadata = {
  title: 'Benchmarks',
  description:
    'Visualize o desempenho de produtos em diversos jogos e testes sintéticos realizados pela nossa equipe.',
}

export default async function BenchmarksLayout({
  children,
}: SettingsLayoutProps) {
  const user = await getCurrentUser()

  const { data } = await getClient().query<{
    benchmarks: (Benchmark & { childrenCount: number })[]
    categories: {
      id: string
      name: string
      filters: Pick<Filter, 'name' | 'slug' | 'options'>[]
      products: (Pick<Product, 'name' | 'slug' | 'imageUrl'> & {
        category: { name: string }
        subcategory: { name: string }
      })[]
    }[]
  }>({
    query: GET_BENCHMARKS,
    variables: {
      getBenchmarksInput: {
        parentId: null,
      },
      includeProductsWithBenchmarks: true,
    },
    errorPolicy: 'all',
  })

  const benchmarks = data?.benchmarks ?? []
  const categories = data?.categories ?? []

  const filteredHiddenBenchmarks = benchmarks.filter(
    (benchmark) =>
      !benchmark.hidden || (benchmark.hidden && user?.role === 'ADMIN'),
  )

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
          {categories
            .filter((category) => category.products.length > 0)
            .map((category) => (
              <div className="space-y-1" key={category.id}>
                <ProductSelect
                  products={category.products}
                  categoryName={category.name}
                />
                {category.filters.length > 0 && (
                  <BenchmarkFilters filters={category.filters} />
                )}
              </div>
            ))}
          <Separator className="hidden lg:block" />
          {benchmarks.length > 0 && (
            <BenchmarkExplorer root={filteredHiddenBenchmarks} />
          )}
        </aside>
        {children}
      </div>
    </div>
  )
}
