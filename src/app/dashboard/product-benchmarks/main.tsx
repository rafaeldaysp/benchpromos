'use client'

import { DataTable } from '@/components/data-table/data-table'

import { type BenchmarkType, columns } from './columns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import React from 'react'
import { useFormStore } from '@/hooks/use-form-store'
import { useRouter } from 'next/navigation'

interface BenchmarksMainProps {
  benchmarks: BenchmarkType[]
}

export function BenchmarksMain({ benchmarks }: BenchmarksMainProps) {
  const [benchmark, setSelectedBenchmark] =
    React.useState<Pick<BenchmarkType, 'benchmark'>>()
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()
  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-x-2">
        <Sheet
          open={openDialogs['retailerCreateForm']}
          onOpenChange={(open) => setOpenDialog('retailerCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Novo</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>NOVO BENCHMARK</SheetTitle>
            </SheetHeader>

            {/* <BenchmarkForm/> */}
          </SheetContent>
        </Sheet>
      </div>
      <DataTable columns={columns} data={benchmarks} />
    </div>
  )
}
