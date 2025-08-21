'use client'

import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useQueryString } from '@/hooks/use-query-string'

interface PaginationProps {
  page: number
  pageCount: number
  pageString?: string
}

export function Pagination({
  page,
  pageCount,
  pageString = 'page',
}: PaginationProps) {
  const [isPending, startTransition] = React.useTransition()
  const pathname = usePathname()
  const router = useRouter()
  const { createQueryString } = useQueryString()

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
        className="hidden size-8 lg:flex"
        disabled={page === 1 || isPending}
        onClick={() => {
          startTransition(() => {
            router.push(
              `${pathname}?${createQueryString({
                [pageString]: 1,
              })}`,
            )
          })
        }}
      >
        <Icons.ChevronsLeft className="size-4" aria-hidden="true" />
      </Button>
      <Button
        aria-label="Ir para a página anterior"
        variant="outline"
        size="icon"
        className="size-8"
        disabled={page === 1 || isPending}
        onClick={() => {
          startTransition(() => {
            router.push(
              `${pathname}?${createQueryString({
                [pageString]: Number(page) - 1,
              })}`,
            )
          })
        }}
      >
        <Icons.ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      {paginationRange.map((pageNumber, i) =>
        pageNumber === '...' ? (
          <Button
            key={i}
            aria-label=""
            variant="outline"
            size="icon"
            className="size-8"
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
            className="size-8"
            disabled={isPending}
            onClick={() => {
              startTransition(() => {
                router.push(
                  `${pathname}?${createQueryString({
                    [pageString]: pageNumber,
                  })}`,
                )
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
        className="size-8"
        disabled={page === pageCount || isPending}
        onClick={() => {
          startTransition(() => {
            router.push(
              `${pathname}?${createQueryString({
                [pageString]: Number(page) + 1,
              })}`,
            )
          })
        }}
      >
        <Icons.ChevronRight className="size-4" aria-hidden="true" />
      </Button>
      <Button
        aria-label="Ir para a última página"
        variant="outline"
        size="icon"
        className="hidden size-8 lg:flex"
        disabled={page === pageCount || isPending}
        onClick={() => {
          router.push(
            `${pathname}?${createQueryString({
              [pageString]: pageCount,
            })}`,
          )
        }}
      >
        <Icons.ChevronsRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
