'use client'

import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { useSearchParams } from 'next/navigation'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { SaleCard } from '@/components/sales/sale-card'
import { Skeleton } from '@/components/ui/skeleton'
import { GET_SALES, type GetSalesQuery } from '@/queries'
import ScrollToTopButton from '../scroll-to-top-button'
import { SalesNavSimplified } from './sales-nav-simplified'

const SALES_PER_SCROLL = 12

interface SalesProps {
  user?: { id: string; role: 'ADMIN' | 'MOD' | 'USER' }
  productSlug?: string
}

export function Sales({ user, productSlug }: SalesProps) {
  const [isPending, startTransition] = React.useTransition()
  const searchParams = useSearchParams()

  const showExpired = searchParams.get('expired') ? true : false
  const categories = searchParams.get('categories')?.split('.')

  const { data, fetchMore, client } = useSuspenseQuery<GetSalesQuery>(
    GET_SALES,
    {
      refetchWritePolicy: 'overwrite',
      variables: {
        paginationInput: {
          limit: SALES_PER_SCROLL,
          page: 1,
        },
        productSlug,
        showExpired,
        categories,
      },
    },
  )

  const pageCount = data.sales.pages
  const sales = data.sales.list
  const page = Math.ceil(sales.length / SALES_PER_SCROLL)

  function onEntry() {
    startTransition(() => {
      fetchMore({
        variables: {
          paginationInput: {
            limit: SALES_PER_SCROLL,
            page: page + 1,
          },
          productSlug,
          showExpired,
        },
        updateQuery(previousResult, { fetchMoreResult }) {
          const previousSales = previousResult.sales
          const fetchMoreSales = fetchMoreResult.sales

          fetchMoreResult.sales.list = [
            ...previousSales.list,
            ...fetchMoreSales.list,
          ]

          return { ...fetchMoreResult }
        },
      })
    })
  }

  const hasMoreSales = page < pageCount

  return (
    <main className="space-y-4">
      <SalesNavSimplified />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sales.map((sale) => (
          <SaleCard
            key={sale.id}
            sale={sale}
            user={user}
            apolloClient={client}
          />
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
        <ScrollToTopButton />
      </div>
    </main>
  )
}
