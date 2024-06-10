'use client'

import { type ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'

import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableRowActions } from '@/components/data-table/data-table-row-actions'
import { Checkbox } from '@/components/ui/checkbox'

export type BenchmarkData = {
  id: string
  result: number
  unit: string
  benchmark: { id: string; name: string }
  product: { alias: string; imageUrl: string }
  products: { id: string; name: string; imageUrl: string; slug: string }[]
  description?: string
  video?: string
}

export const columns: ColumnDef<BenchmarkData>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar tudo"
        className="translate-y-[2px] border-black data-[state=checked]:bg-black data-[state=checked]:text-white dark:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="translate-y-[2px] border-black data-[state=checked]:bg-black data-[state=checked]:text-white dark:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'product',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Produto" />
    ),
    cell: ({ row }) => {
      const product = row.getValue('product') as BenchmarkData['product']

      return (
        <div className="ml-2 flex min-w-[200px] gap-x-4">
          <div className="relative h-16 w-16">
            <Image
              src={product.imageUrl}
              alt=""
              className="rounded-lg object-contain"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm leading-7">{product.alias}</p>
          </div>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const products = row.original.products
      const input = value as string[]
      const searchString = products.map((product) => product.slug).join('')

      return (
        row.getIsSelected() ||
        input.some((search) => searchString.includes(search))
      )
    },
    meta: {
      header: 'Produtos',
    },
  },
  {
    id: 'benchmark',
    accessorKey: 'benchmark.name',
    header: 'Benchmark',
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      header: 'Benchmark',
    },
  },
  {
    accessorKey: 'result',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resultado" />
    ),
    cell({ row }) {
      const result = row.getValue('result') as BenchmarkData['result']

      return <div className="ml-4">{result}</div>
    },
    meta: {
      header: 'Resultado',
    },
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
    meta: {
      header: 'Descrição',
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
