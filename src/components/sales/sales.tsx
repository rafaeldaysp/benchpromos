'use client'

import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { SaleCard } from '@/components/sales/sale-card'
import { Skeleton } from '@/components/ui/skeleton'
import { GET_SALES, type GetSalesQuery } from '@/queries'

const SALES_PER_SCROLL = 1

interface SalesProps {
  user?: { id: string; isAdmin: boolean }
  productSlug?: string
}

export function Sales({ user, productSlug }: SalesProps) {
  const [isPending, startTransition] = React.useTransition()

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

  if (sales.length === 0)
    return (
      <h3 className="text-sm text-muted-foreground">
        Estamos constantemente atualizando nossas ofertas, por isso, fique de
        olho para futuras promoções que podem estar a caminho
      </h3>
    )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sales.map((sale) => (
        <SaleCard key={sale.id} sale={sale} user={user} apolloClient={client} />
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
