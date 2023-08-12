'use client'

import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { SaleCard } from '@/components/sale-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category, Comment, Sale } from '@/types'

const SALES_PER_SCROLL = 1

const GET_SALES = gql`
  query GetSales($paginationInput: PaginationInput) {
    sales(paginationInput: $paginationInput) {
      id
      title
      slug
      imageUrl
      url
      price
      installments
      totalInstallmentPrice
      caption
      review
      label
      coupon
      cashback
      createdAt
      categoryId
      productSlug
      category {
        name
        slug
      }
      comments {
        id
      }
      reactions {
        content
        users {
          id
        }
      }
    }
  }
`

interface SalesProps {
  userId?: string
}

export function Sales({ userId }: SalesProps) {
  const [isPending, startTransition] = React.useTransition()
  const [page, setPage] = React.useState(1)

  const { data, fetchMore } = useSuspenseQuery<{
    sales: (Sale & {
      category: Pick<Category, 'name' | 'slug'>
      comments: Pick<Comment, 'id'>[]
      reactions: { content: string; users: { id: string }[] }[]
    })[]
  }>(GET_SALES, {
    refetchWritePolicy: 'overwrite',
    variables: {
      paginationInput: {
        limit: SALES_PER_SCROLL,
        page: 1,
      },
    },
  })

  const initialSales = data.sales
  const [sales, setSales] = React.useState(initialSales)

  function onEntry() {
    startTransition(async () => {
      const { data } = await fetchMore({
        variables: {
          paginationInput: {
            limit: SALES_PER_SCROLL,
            page: page + 1,
          },
        },
      })

      setSales([...sales, ...data.sales])
      setPage((prev) => prev + 1)
    })
  }

  const hasMoreSales = SALES_PER_SCROLL * page <= sales.length

  return (
    <div className="my-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sales.map((sale) => (
        <SaleCard key={sale.id} sale={sale} userId={userId} />
      ))}
      {isPending ? (
        Array.from({ length: SALES_PER_SCROLL }).map((_, i) => (
          <Skeleton key={i} className="h-full w-full" />
        ))
      ) : (
        <InView
          as="div"
          delay={500}
          hidden={!hasMoreSales}
          onChange={(_, entry) => {
            if (entry.isIntersecting) onEntry()
          }}
        />
      )}
    </div>
  )
}
