'use client'

import { gql, useSuspenseQuery } from '@apollo/client'
import { type Table } from '@tanstack/react-table'

import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { type Product } from '@/types'
import { ProductSelect } from '../benchmarks/product-select'

const GET_PRODUCTS = gql`
  query GetBenchmarks(
    $getProductsInput: GetProductsInput
    $getBenchmarksInput: GetBenchmarksInput
  ) {
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

    benchmarks(getBenchmarksInput: $getBenchmarksInput) {
      name
      slug
      resultsCount
    }
  }
`

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const { data } = useSuspenseQuery<{
    productsList: {
      products: (Pick<Product, 'name' | 'slug' | 'imageUrl'> & {
        category: { name: string }
        subcategory: { name: string }
      })[]
    }
    benchmarks: { name: string; slug: string; resultsCount: number }[]
  }>(GET_PRODUCTS, {
    variables: {
      getProductsInput: {
        hasBenchmark: true,
        sortBy: 'relevance',
      },
      getBenchmarksInput: {
        hasResults: true,
      },
    },
    errorPolicy: 'all',
  })

  const products = data?.productsList.products ?? []
  const benchmarks = data?.benchmarks ?? []

  const benchmarkOptions = benchmarks.map((benchmark) => {
    return {
      label: benchmark.name,
      value: benchmark.slug,
      count: benchmark.resultsCount,
    }
  })

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="w-fit sm:w-60">
          <ProductSelect products={products} />
        </div>
        {table.getColumn('benchmark') && (
          <DataTableFacetedFilter
            title="Benchmarks"
            options={benchmarkOptions}
          />
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
