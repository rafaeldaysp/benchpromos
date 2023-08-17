'use client'

import { type Table } from '@tanstack/react-table'
import { X } from 'lucide-react'

import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filtrar produtos..."
          value={(table.getColumn('product')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('product')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('benchmark') && (
          <DataTableFacetedFilter
            column={table.getColumn('benchmark')}
            title="Benchmarks"
            options={benchmarkOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            <span className="hidden sm:block">Limpar</span>

            <X className="h-4 w-4 sm:ml-2" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
