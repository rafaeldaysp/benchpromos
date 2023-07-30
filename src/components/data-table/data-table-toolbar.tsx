'use client'

import { type Table } from '@tanstack/react-table'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DataTableViewOptions } from './data-table-view-options'

import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { Icons } from '../icons'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  benchmarks: { name: string }[]
}

export function DataTableToolbar<TData>({
  table,
  benchmarks,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const benchmarkOptions = benchmarks.map((benchmark) => {
    return {
      label: benchmark.name,
      value: benchmark.name,
    }
  })

  // const productOptions = products.map((product) => {
  //   return {
  //     label: product.name,
  //     value: product.name,
  //   }
  // })

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Buscar produtos..."
          value={(table.getColumn('product')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('product')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {/* {table.getColumn('product') && (
          <DataTableFacetedFilter
            column={table.getColumn('product')}
            title="Produtos"
            options={productOptions}
          />
        )} */}

        {table.getColumn('benchmark') && (
          <DataTableFacetedFilter
            column={table.getColumn('benchmark')}
            title="Testes"
            options={benchmarkOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Resetar
            <Icons.X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
