'use client'

import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { SaleCard } from '@/components/sales/sale-card'
import { SmallSaleCard } from '@/components/sales/small-sale-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/hooks/use-media-query'
import { GET_SALES, type GetSalesQuery } from '@/queries'

const SALES_PER_SCROLL = 1

interface SalesProps {
  user?: { id: string; isAdmin: boolean }
  viewport: 'mobile' | 'desktop'
}

export function Sales({ user, viewport }: SalesProps) {
  const isSm = useMediaQuery('(max-width: 640px)')
  const [isPending, startTransition] = React.useTransition()
  const [hasMoreSales, setHasMoreSales] = React.useState(true)

  const { data, fetchMore, client } = useSuspenseQuery<GetSalesQuery>(
    GET_SALES,
    {
      refetchWritePolicy: 'overwrite',
      // fetchPolicy: 'cache-and-network',
      variables: {
        paginationInput: {
          limit: SALES_PER_SCROLL,
          page: 1,
        },
      },
    },
  )

  const sales = data.sales.list
  const page = Math.ceil(sales.length / SALES_PER_SCROLL)

  React.useEffect(() => {
    setHasMoreSales(true)
  }, [page])

  function onEntry() {
    startTransition(() => {
      fetchMore({
        variables: {
          paginationInput: {
            limit: SALES_PER_SCROLL,
            page: page + 1,
          },
        },
        updateQuery(previousResult, { fetchMoreResult }) {
          if (!fetchMoreResult.sales.list.length) {
            setHasMoreSales(false)
          }

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

  return (
    <div className="my-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sales.map((sale) => {
        return (
          <SmallSaleCard
            key={sale.id}
            sale={sale}
            user={user}
            apolloClient={client}
          />
        )
        return (
          <SaleCard
            key={sale.id}
            sale={sale}
            user={user}
            apolloClient={client}
          />
        )
      })}
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
