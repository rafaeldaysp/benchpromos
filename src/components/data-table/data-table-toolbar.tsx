'use client'

import { gql, useSuspenseQuery, useMutation } from '@apollo/client'
import { type Table } from '@tanstack/react-table'
import { Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { type Product } from '@/types'
import { ProductSelect } from '../benchmarks/product-select'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { env } from '@/env.mjs'

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

const TOGGLE_BENCHMARK_RESULT_ACTIVE = gql`
  mutation ($input: ToggleBenchmarkResultActiveInput!) {
    toggleBenchmarkResultsActive(toggleBenchmarkResultActiveInput: $input)
  }
`

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const selectedRows = table.getSelectedRowModel().rows
  const router = useRouter()

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

  const [toggleBenchmarkResultActive, { loading: isLoading }] = useMutation(
    TOGGLE_BENCHMARK_RESULT_ACTIVE,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      onCompleted(_data, _clientOptions) {
        toast.success('Resultados ativados com sucesso.')
        router.refresh()
      },
    },
  )

  const products = data?.productsList.products ?? []
  const benchmarks = data?.benchmarks ?? []

  const benchmarkOptions = benchmarks.map((benchmark) => {
    return {
      label: benchmark.name,
      value: benchmark.slug,
      count: benchmark.resultsCount,
    }
  })

  function onToggleBenchmarkResultActive(status: boolean) {
    toggleBenchmarkResultActive({
      variables: {
        input: {
          // @ts-expect-error ...
          ids: selectedRows.map((row) => row.original.id),
          active: status,
        },
      },
    })
  }

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
      <div className="flex items-center gap-2">
        {selectedRows.length > 0 && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Check className="mr-2 size-4" />
                  Ativar ({selectedRows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ativar resultados</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você tem certeza que deseja ativar {selectedRows.length}{' '}
                    resultado(s)? Esta ação fará com que os resultados{' '}
                    selecionados fiquem visíveis.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isLoading}
                    onClick={() => onToggleBenchmarkResultActive(true)}
                  >
                    {isLoading ? 'Ativando...' : 'Ativar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <X className="mr-2 size-4" />
                  Desativar ({selectedRows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desativar resultados</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você tem certeza que deseja desativar {selectedRows.length}{' '}
                    resultado(s)? Esta ação fará com que os resultados{' '}
                    selecionados fiquem ocultos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isLoading}
                    onClick={() => onToggleBenchmarkResultActive(false)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isLoading ? 'Desativando...' : 'Desativar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
