'use client'

import { DataTableRowActions } from '@/components/data-table/data-table-row-actions'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { type Product } from '@/types'
import { type ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'

export type BenchmarkType = {
  id: string
  benchmark: { id: string; name: string }
  product: { id: string; name: string }
  result: number
  description?: string
}

export const columns: ColumnDef<BenchmarkType>[] = [
  // {
  //   id: 'id',
  //   accessorKey: 'id',
  //   enableSorting: false,
  //   header({ column }) {
  //     column.toggleVisibility(false)
  //   },
  // },
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value)
        }}
        aria-label="Selecionar linha"
      />
    ),
    enableHiding: false,
  },
  {
    id: 'product',
    accessorKey: 'product',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Produto
          <Icons.ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const product = row.getValue('product') as Pick<
        Product,
        'id' | 'imageUrl' | 'name'
      >
      return (
        <div className="flex gap-x-4">
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
            <p className="text-sm leading-7">{product.name}</p>
          </div>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as Pick<
        Product,
        'id' | 'imageUrl' | 'name'
      >
      const input = value as string

      const productName = rowValue.name.toLowerCase()
      const searchArray = input.toLowerCase().split(' ')

      return (
        row.getIsSelected() ||
        searchArray.every((search) => productName.includes(search))
      )
    },
    footer: 'Produto',
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
    footer: 'Descrição',
  },
  {
    id: 'benchmark',
    accessorKey: 'benchmark.name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Teste
          <Icons.ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    footer: 'Teste',
  },

  {
    id: 'result',
    accessorKey: 'result',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Resultado
          <Icons.ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const result = row.getValue('result') as number
      return <div className="text-center">{result}</div>
    },
    footer: 'Resultado',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <DataTableRowActions row={row} />
    },
  },
]
