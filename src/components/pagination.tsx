'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  pageCount: number
}

export function Pagination({ page, pageCount }: PaginationProps) {
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  const paginationRange = React.useMemo(() => {
    const delta = 3

    const range = []
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(pageCount - 1, page + delta);
      i++
    ) {
      range.push(i)
    }

    if (page - delta > 2) {
      range.unshift('...')
    }
    if (page + delta < pageCount - 1) {
      range.push('...')
    }

    range.unshift(1)
    if (pageCount !== 1) {
      range.push(pageCount)
    }

    return range
  }, [page, pageCount])

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        aria-label="Ir para a primeira página"
        variant="outline"
        size="icon"
        className="hidden h-8 w-8 lg:flex"
        disabled={page === 1 || isPending}
        onClick={() => {
          startTransition(() => {
            router.push('')
          })
        }}
      >
        <Icons.ChevronsLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        aria-label="Ir para a página anterior"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={page === 1 || isPending}
        onClick={() => {
          startTransition(() => {
            router.push('')
          })
        }}
      >
        <Icons.ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      {paginationRange.map((pageNumber, i) =>
        pageNumber === '...' ? (
          <Button
            key={i}
            aria-label=""
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled
          >
            ...
          </Button>
        ) : (
          <Button
            key={i}
            aria-label={`Página ${pageNumber}`}
            variant={page === pageNumber ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            disabled={isPending}
            onClick={() => {
              startTransition(() => {
                router.push('')
              })
            }}
          >
            {pageNumber}
          </Button>
        ),
      )}
      <Button
        aria-label="Ir para a página seguinte"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={page === pageCount || isPending}
        onClick={() => {
          startTransition(() => {
            router.push('')
          })
        }}
      >
        <Icons.ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        aria-label="Ir para a última página"
        variant="outline"
        size="icon"
        className="hidden h-8 w-8 lg:flex"
        disabled={page === pageCount || isPending}
        onClick={() => {
          router.push('')
        }}
      >
        <Icons.ChevronsRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
