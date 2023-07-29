'use client'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { DataTableRowActions } from '@/components/data-table/data-table-row-actions'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
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
  {
    id: 'image',
    accessorKey: 'product.imageUrl',
    header: '',
    cell: ({ row }) => {
      return (
        <div className="relative h-16 w-16">
          <Image
            src={row.getValue('image')}
            alt=""
            className="rounded-lg object-contain"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )
    },
    footer: 'Imagem',
  },
  {
    id: 'product',
    accessorKey: 'product.name',
    header: 'Produto',
    cell: ({ row }) => {
      return (
        <div className="flex-1">
          <p className="text-sm leading-7">{row.getValue('product')}</p>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as string
      const search = value as string

      return rowValue.toLowerCase().includes(search.toLowerCase())
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
    header: 'Teste',
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
