'use client'

import { type ColumnDef } from '@tanstack/react-table'

export type BenchmarkType = {
  id: string
  benchmark: { id: string; name: string }
  product: { id: string; name: string }
  result: number
  description?: string
}

export const columns: ColumnDef<BenchmarkType>[] = [
  {
    accessorKey: 'product.name',
    header: 'Produto',
  },
  {
    accessorKey: 'benchmark.name',
    header: 'Teste',
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
  },
  {
    accessorKey: 'result',
    header: 'Resultado',
  },
]
