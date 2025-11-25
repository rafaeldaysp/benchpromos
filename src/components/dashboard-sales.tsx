import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { Icons } from '@/components/icons'
import { ScrollArea } from '@/components/ui/scroll-area'
import { env } from '@/env.mjs'
import { cn } from '@/lib/utils'
import type {
  Cashback,
  Category,
  Discount,
  Coupon,
  Product,
  Retailer,
  Sale,
} from '@/types'
import { removeNullValues } from '@/utils'
import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

const SALES_PER_PAGE = 12

const GET_RETAILERS = gql`
  query GetRetailers {
    retailers {
      id
      name
    }
  }
`

const GET_SALES = gql`
  query GetDashboardSales(
    $pagination: PaginationInput
    $search: String
    $showExpired: Boolean
    $retailerId: ID
  ) {
    sales(
      paginationInput: $pagination
      search: $search
      showExpired: $showExpired
      retailerId: $retailerId
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
        tag
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
        discounts {
          id
          label
          discount
          retailerId
        }
        couponSchema {
          id
          code
          discount
          retailerId
        }
        couponId
        retailerId
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
      cashback?: Cashback
      discounts?: Discount[]
      couponSchema?: Coupon
    })[]
  }) => React.ReactNode
}

export function DashboardSales({ children }: DashboardSalesProps) {
  const [isPending, startTransition] = React.useTransition()
  const [searchInput, setSearchInput] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [retailerId, setRetailerId] = React.useState<string>('')

  const { data: retailersData } = useSuspenseQuery<{
    retailers: Retailer[]
  }>(GET_RETAILERS, {
    fetchPolicy: 'cache-first',
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
  })

  const { data, fetchMore } = useSuspenseQuery<{
    sales: {
      count: number
      list: (Sale & {
        product: Pick<Product, 'slug' | 'name' | 'imageUrl'> & {
          category: Pick<Category, 'id' | 'name'>
        }
        category: Pick<Category, 'id' | 'name'>
        cashback?: Cashback
        discounts?: Discount[]
        couponSchema?: Coupon
      })[]
    }
  }>(GET_SALES, {
    fetchPolicy: 'cache-and-network',
    refetchWritePolicy: 'overwrite',
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    variables: {
      search: query,
      pagination: {
        limit: SALES_PER_PAGE,
        page: 1,
      },
      showExpired: true,
      retailerId: retailerId || undefined,
    },
  })

  const sales = data?.sales.list.map((sale) => removeNullValues(sale))
  const page = Math.ceil(sales.length / SALES_PER_PAGE)
  const pageCount = Math.ceil(data?.sales.count / SALES_PER_PAGE)

  function onEntry() {
    startTransition(() => {
      fetchMore({
        variables: {
          search: query,
          pagination: {
            limit: SALES_PER_PAGE,
            page: page + 1,
          },
          showExpired: true,
          retailerId: retailerId || undefined,
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
      <div className="flex w-full items-center space-x-2">
        <Input
          placeholder="Pesquise por uma promoção..."
          className="w-full"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setQuery(searchInput)
            }
          }}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-60 justify-between">
              {retailerId
                ? retailersData.retailers.find((r) => r.id === retailerId)
                    ?.name || 'Varejista'
                : 'Varejista'}
              <Icons.ChevronDown className="ml-2 size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar varejista..." />
              <CommandList>
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {retailersData.retailers.map((retailer) => {
                    const isSelected = retailerId === retailer.id
                    return (
                      <CommandItem
                        key={retailer.id}
                        disabled={isPending}
                        className={cn({ 'opacity-60': isPending })}
                        onSelect={() => {
                          startTransition(() => {
                            setRetailerId(isSelected ? '' : retailer.id)
                          })
                        }}
                      >
                        <span
                          className={cn(
                            'flex-1',
                            isSelected && 'font-semibold',
                          )}
                        >
                          {retailer.name}
                        </span>
                        {isSelected && (
                          <Icons.Check className="size-4 text-primary" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {retailerId && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          startTransition(() => {
                            setRetailerId('')
                          })
                        }}
                        className="justify-center text-center text-sm"
                      >
                        Limpar filtro
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button onClick={() => setQuery(searchInput)}>Pesquisar</Button>
      </div>

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
                className="mr-2 size-4 animate-spin"
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
