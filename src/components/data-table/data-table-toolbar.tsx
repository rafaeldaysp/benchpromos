'use client'

import { gql, useSuspenseQuery } from '@apollo/client'
import { type Table } from '@tanstack/react-table'
import { useSearchParams } from 'next/navigation'
import * as React from 'react'

import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { type Product } from '@/types'
import { ProductSelect } from '../benchmarks/product-select'

const GET_PRODUCTS = gql`
  query GetBenchmarks($getProductsInput: GetProductsInput) {
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

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  benchmarks: { name: string }[]
}

export function DataTableToolbar<TData>({
  table,
  benchmarks,
}: DataTableToolbarProps<TData>) {
  const params = useSearchParams()
  const selectedProducts = params.get('products')?.split('.')
  // const pathname = usePathname()
  // const router = useRouter()
  // const { createQueryString } = useQueryString()

  const { data } = useSuspenseQuery<{
    productsList: {
      products: (Pick<Product, 'name' | 'slug' | 'imageUrl'> & {
        category: { name: string }
        subcategory: { name: string }
      })[]
    }
  }>(GET_PRODUCTS, {
    variables: {
      getProductsInput: {
        hasBenchmark: true,
        sortBy: 'relevance',
      },
    },
    errorPolicy: 'all',
  })

  const products = data?.productsList.products ?? []

  // const isFiltered = table.getState().columnFilters.length > 0

  const benchmarkOptions = benchmarks.map((benchmark) => {
    return {
      label: benchmark.name,
      value: benchmark.name,
    }
  })

  React.useEffect(() => {
    table.getColumn('product')?.setFilterValue(selectedProducts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="w-fit sm:w-60">
          <ProductSelect products={products} />
        </div>
        {table.getColumn('benchmark') && (
          <DataTableFacetedFilter
            column={table.getColumn('benchmark')}
            title="Benchmarks"
            options={benchmarkOptions}
          />
        )}
        {/* {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters()
              router.push(
                `${pathname}?${createQueryString({ products: null })}`,
              )
            }}
            className="px-2 lg:px-3"
          >
            <span className="hidden sm:block">Limpar</span>

            <X className="h-4 w-4 sm:ml-2" />
          </Button>
        )} */}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
