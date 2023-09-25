'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { type Benchmark, type BenchmarkResult } from '@/types'
import { Icons } from './icons'
import { buttonVariants } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

interface ProductBenchmarksProps {
  benchmarksResults: (Omit<BenchmarkResult, 'productId' | 'benchmarkId'> & {
    benchmark: Omit<Benchmark, 'id'>
  })[]
  productSlug: string
}

export function ProductBenchmarks({
  benchmarksResults,
  productSlug,
}: ProductBenchmarksProps) {
  return (
    <Table>
      <TableCaption>Tabela de resultado por benchmark.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Benchmark</TableHead>
          <TableHead>Resultado</TableHead>
          <TableHead className="max-sm:hidden">Descrição</TableHead>
          <TableHead />
          {/* <TableHead className="text-right">Amount</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {benchmarksResults.map((benchmarkResult) => (
          <DropdownMenu key={benchmarkResult.id}>
            <TableRow className="even:bg-muted">
              <TableCell className="font-medium">
                {benchmarkResult.benchmark.name}
              </TableCell>
              <TableCell>{benchmarkResult.result} [FPS]</TableCell>
              <TableCell className="max-sm:hidden">
                {benchmarkResult.description ?? ''}
              </TableCell>
              <TableCell>
                <DropdownMenuTrigger>
                  <Icons.ChevronRight className="h-4 w-4" />
                </DropdownMenuTrigger>
              </TableCell>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="h-fit w-fit p-0">
                  <Link
                    href={`/benchmarks/${benchmarkResult.benchmark.slug}?product=${productSlug}`}
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      'px-4 py-1 text-sm',
                    )}
                  >
                    <Icons.BarChart4 className="mr-2 h-4 w-4" />
                    Comparar
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </TableRow>
          </DropdownMenu>
        ))}
      </TableBody>
    </Table>
  )
}
