import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { useSearchParams } from 'next/navigation'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { Icons } from '@/components/icons'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Category, Product } from '@/types'
import { removeNullValues } from '@/utils'
import { Button } from './ui/button'

const PRODUCTS_PER_PAGE = 12

const GET_PRODUCTS = gql`
  query GetProducts($input: GetProductsInput) {
    productsList: products(getProductsInput: $input) {
      pages
      products {
        id
        name
        imageUrl
        specs {
          title
          value
        }
        pros {
          value
        }
        cons {
          value
        }
        description
        reviewUrl
        referencePrice
        categoryId
        slug
        subcategoryId
        recommended
        views
        category {
          id
          name
        }
        filters {
          optionId
          option {
            value
          }
        }
        suggestionSlugs
      }
    }
  }
`

interface DashboardProductsProps {
  children: (data: {
    products: (Product & {
      category: Pick<Category, 'id' | 'name'>
      filters: { optionId: string; option: { value: string } }[]
    })[]
  }) => React.ReactNode
}

export function DashboardProducts({ children }: DashboardProductsProps) {
  const [isPending, startTransition] = React.useTransition()
  const [searchInput, setSearchInput] = React.useState('')
  const [query, setQuery] = React.useState('')

  const searchParams = useSearchParams()

  const sortBy = searchParams.get('sort')
  const category = searchParams.get('category')

  const { data, fetchMore } = useSuspenseQuery<{
    productsList: {
      pages: number
      products: (Product & {
        category: Pick<Category, 'id' | 'name'>
        filters: { optionId: string; option: { value: string } }[]
      })[]
    }
  }>(GET_PRODUCTS, {
    fetchPolicy: 'cache-and-network',
    refetchWritePolicy: 'overwrite',
    variables: {
      input: {
        search: query,
        pagination: {
          limit: PRODUCTS_PER_PAGE,
          page: 1,
        },
        sortBy,
        category,
      },
    },
  })

  const pageCount = data?.productsList.pages
  const products = data?.productsList.products.map((product) =>
    removeNullValues(product),
  )
  const page = Math.ceil(products.length / PRODUCTS_PER_PAGE)

  function onEntry() {
    startTransition(() => {
      fetchMore({
        variables: {
          input: {
            search: query,
            pagination: {
              limit: PRODUCTS_PER_PAGE,
              page: page + 1,
            },
            sortBy,
            category,
          },
        },
        updateQuery(previousResult, { fetchMoreResult }) {
          const fetchMorePages = previousResult.productsList.pages
          const previousProducts = previousResult.productsList.products
          const fetchMoreProducts = fetchMoreResult.productsList.products

          fetchMoreResult.productsList.pages = fetchMorePages
          fetchMoreResult.productsList.products = [
            ...previousProducts,
            ...fetchMoreProducts,
          ]

          return { ...fetchMoreResult }
        },
      })
    })
  }

  const hasMoreProducts = page < pageCount

  return (
    <div className="space-y-4">
      <div className="flex w-full items-center space-x-2">
        <Input
          placeholder="Pesquise por um produto..."
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
        <Button onClick={() => setQuery(searchInput)}>Pesquisar</Button>
      </div>

      {products.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': products.length > 6,
          })}
        >
          {children({ products })}
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
              hidden={!hasMoreProducts}
              onChange={(_, entry) => {
                if (entry.isIntersecting) onEntry()
              }}
            />
          )}
        </ScrollArea>
      ) : (
        <div className="flex justify-center">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  )
}
