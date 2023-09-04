'use client'

import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { SaleCard } from '@/components/sales/sale-card'
import { Skeleton } from '@/components/ui/skeleton'
import { GET_SALES, type GetSalesQuery } from '@/queries'
import { SmallSaleCard } from './small-sale-card'
import { useMediaQuery } from '@/hooks/use-media-query'

const SALES_PER_SCROLL = 1

interface SalesProps {
  user?: { id: string; isAdmin: boolean }
}

export function Sales({ user }: SalesProps) {
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

  const sales = data.sales
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
          if (!fetchMoreResult.sales.length) {
            setHasMoreSales(false)
          }

          const previousSales = previousResult.sales
          const fetchMoreSales = fetchMoreResult.sales

          fetchMoreResult.sales = [...previousSales, ...fetchMoreSales]

          return { ...fetchMoreResult }
        },
      })
    })
  }

  return (
    <div className="my-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sales.map((sale) => {
        if (isSm)
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
