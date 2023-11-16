import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { Icons } from '@/components/icons'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import type { Cashback, Category, Product, Sale } from '@/types'
import { removeNullValues } from '@/utils'
import { Input } from './ui/input'

const SALES_PER_PAGE = 12

const GET_SALES = gql`
  query GetSales(
    $pagination: PaginationInput
    $search: String
    $showExpired: Boolean
  ) {
    sales(
      paginationInput: $pagination
      search: $search
      showExpired: $showExpired
    ) {
      count
      list {
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
        cashbackId
        createdAt
        categoryId
        productSlug
        highlight
        sponsored
        category {
          id
          name
        }
        product {
          name
          slug
          imageUrl
          category {
            id
            name
          }
        }
        cashback {
          id
          provider
          value
          url
        }
      }
    }
  }
`

interface DashboardSalesProps {
  children: (data: {
    sales: (Sale & {
      product: Pick<Product, 'slug' | 'name' | 'imageUrl'> & {
        category: Pick<Category, 'id' | 'name'>
      }
      category: Pick<Category, 'id' | 'name'>
      cashback: Cashback
    })[]
  }) => React.ReactNode
}

export function DashboardSales({ children }: DashboardSalesProps) {
  const [isPending, startTransition] = React.useTransition()
  const [query, setQuery] = React.useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data, refetch, fetchMore } = useSuspenseQuery<{
    sales: {
      count: number
      list: (Sale & {
        product: Pick<Product, 'slug' | 'name' | 'imageUrl'> & {
          category: Pick<Category, 'id' | 'name'>
        }
        category: Pick<Category, 'id' | 'name'>
        cashback: Cashback
      })[]
    }
  }>(GET_SALES, {
    fetchPolicy: 'cache-and-network',
    refetchWritePolicy: 'overwrite',
    variables: {
      search: debouncedQuery,
      pagination: {
        limit: SALES_PER_PAGE,
        page: 1,
      },
      showExpired: true,
    },
  })

  const sales = data?.sales.list.map((sale) => removeNullValues(sale))
  const page = Math.ceil(sales.length / SALES_PER_PAGE)
  const pageCount = Math.ceil(data?.sales.count / SALES_PER_PAGE)

  React.useEffect(() => {
    if (debouncedQuery.length > 0) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  function onEntry() {
    startTransition(() => {
      fetchMore({
        variables: {
          search: debouncedQuery,
          pagination: {
            limit: SALES_PER_PAGE,
            page: page + 1,
          },
          showExpired: true,
        },
        updateQuery(previousResult, { fetchMoreResult }) {
          const fetchMorePages = previousResult.sales.count
          const previousSales = previousResult.sales.list
          const fetchMoreSales = fetchMoreResult.sales.list

          fetchMoreResult.sales.count = fetchMorePages
          fetchMoreResult.sales.list = [...previousSales, ...fetchMoreSales]

          return { ...fetchMoreResult }
        },
      })
    })
  }

  const hasMoreSales = page < pageCount

  return (
    <div className="space-y-4">
      <Input
        placeholder="Pesquise por uma promoção..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {sales.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': sales.length > 6,
          })}
        >
          {children({ sales })}
          {isPending ? (
            <div className="flex justify-center py-4">
              <Icons.Spinner
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            </div>
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
        </ScrollArea>
      ) : (
        <div className="flex justify-center">
          <p className="text-muted-foreground">Nenhuma promoção encontrada.</p>
        </div>
      )}
    </div>
  )
}
