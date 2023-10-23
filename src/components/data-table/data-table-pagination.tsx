'use client'

import { type Table } from '@tanstack/react-table'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQueryString } from '@/hooks/use-query-string'
import { Pagination } from '../pagination'

const DEFAULT_LIMIT = '10'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  count: number
}

export function DataTablePagination<TData>({
  table,
  count,
}: DataTablePaginationProps<TData>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { initialLimit, initialPage } = {
    initialLimit: searchParams.get('limit'),
    initialPage: searchParams.get('page'),
  }

  const [limit, setLimit] = React.useState(initialLimit ?? undefined)

  const { createQueryString } = useQueryString()

  React.useEffect(() => {
    if (!limit) return

    React.startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          limit,
          page: null,
        })}`,
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit])

  return (
    <div className="flex items-center justify-end px-2 md:justify-between">
      {/* <div className="hidden flex-1 text-sm text-muted-foreground md:block">
        {table.getFilteredSelectedRowModel().rows.length} de{' '}
        {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
      </div> */}

      <div className="hidden items-center space-x-2 md:flex">
        <p className="text-sm font-medium">Linhas por página</p>
        <Select
          value={limit ?? DEFAULT_LIMIT}
          onValueChange={(value) => {
            setLimit(value)
            table.setPageSize(Number(value))
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 40, 200].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-x-2">
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Página {table.getState().pagination.pageIndex + 1} de{' '}
          {table.getPageCount()}
        </div>
        <Pagination
          page={Number(initialPage ?? '1')}
          pageCount={Math.ceil(count / Number(limit ?? DEFAULT_LIMIT))}
        />
      </div>
    </div>
  )
}
