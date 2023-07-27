'use client'

import { DataTable } from '@/components/data-table/data-table'

import { type BenchmarkType, columns } from './columns'

interface BenchmarksMainProps {
  benchmarks: BenchmarkType[]
}

export function BenchmarksMain({ benchmarks }: BenchmarksMainProps) {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={benchmarks} />
    </div>
  )
}
