'use client'

import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { Plus, PackageOpen, Search } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { Icons } from '@/components/icons'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useDebounce } from '@/hooks/use-debounce'
import type { Product } from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'

const PRODUCTS_PER_PAGE = 12

const GET_PRODUCTS_FOR_PICKER = gql`
  query GetProductsForPicker($input: GetProductsInput) {
    productsList: products(getProductsInput: $input) {
      pages
      products {
        id
        name
        imageUrl
        slug
        categoryId
        deals {
          price
          availability
          retailer {
            name
          }
          coupon {
            code
            discount
            availability
          }
          cashback {
            value
            provider
          }
          discounts {
            discount
          }
        }
      }
    }
  }
`

type TierListProduct = Pick<
  Product,
  'id' | 'name' | 'imageUrl' | 'slug' | 'categoryId'
> & {
  deals: {
    price: number
    availability: boolean
    retailer: {
      name: string
    }
    coupon: {
      code: string
      discount: string
      availability: boolean
    }
    cashback: {
      value: number
      provider: string
    }
    discounts: {
      discount: string
    }[]
  }[]
}

interface ProductPickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetTierName: string
  onAddProduct: (product: TierListProduct) => void
  assignedProductIds: Set<string>
  categorySlug: string
}

export function ProductPickerSheet({
  open,
  onOpenChange,
  targetTierName,
  onAddProduct,
  assignedProductIds,
  categorySlug,
}: ProductPickerSheetProps) {
  const [searchInput, setSearchInput] = React.useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full space-y-4 sm:max-w-lg" side="right">
        <SheetHeader>
          <SheetTitle>Adicionar Produtos</SheetTitle>
          <SheetDescription>
            Selecione produtos para adicionar ao tier{' '}
            <strong>{targetTierName}</strong>.
          </SheetDescription>
        </SheetHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Pesquisar produto..."
            className="pl-9"
            type="search"
          />
        </div>

        <React.Suspense
          fallback={
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Icons.Spinner
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
              <p className="text-sm">Carregando produtos...</p>
            </div>
          }
        >
          <ProductPickerList
            search={debouncedSearch}
            assignedProductIds={assignedProductIds}
            onAddProduct={onAddProduct}
            categorySlug={categorySlug}
          />
        </React.Suspense>
      </SheetContent>
    </Sheet>
  )
}

interface ProductPickerListProps {
  search: string
  assignedProductIds: Set<string>
  onAddProduct: (product: TierListProduct) => void
  categorySlug: string
}

function ProductPickerList({
  search,
  assignedProductIds,
  onAddProduct,
  categorySlug,
}: ProductPickerListProps) {
  const [isPending, startTransition] = React.useTransition()

  const { data, fetchMore } = useSuspenseQuery<{
    productsList: {
      pages: number
      products: TierListProduct[]
    }
  }>(GET_PRODUCTS_FOR_PICKER, {
    fetchPolicy: 'cache-and-network',
    refetchWritePolicy: 'overwrite',
    variables: {
      input: {
        search,
        category: categorySlug,
        pagination: {
          limit: PRODUCTS_PER_PAGE,
          page: 1,
        },
      },
    },
  })

  const allProducts = data.productsList.products
  const pageCount = data.productsList.pages
  const page = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE)
  const hasMore = page < pageCount

  function onEntry() {
    startTransition(() => {
      fetchMore({
        variables: {
          input: {
            search,
            category: categorySlug,
            pagination: {
              limit: PRODUCTS_PER_PAGE,
              page: page + 1,
            },
          },
        },
        updateQuery(previousResult, { fetchMoreResult }) {
          const previousProducts = previousResult.productsList.products
          const fetchMoreProducts = fetchMoreResult.productsList.products

          return {
            productsList: {
              ...fetchMoreResult.productsList,
              pages: previousResult.productsList.pages,
              products: [...previousProducts, ...fetchMoreProducts],
            },
          }
        },
      })
    })
  }

  const availableProducts = allProducts.filter(
    (p) => !assignedProductIds.has(p.id),
  )

  if (availableProducts.length === 0 && !hasMore) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <PackageOpen className="mb-3 size-10 opacity-40" />
        <p className="text-sm font-medium">
          {search
            ? 'Nenhum produto encontrado'
            : 'Todos os produtos já foram adicionados'}
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="flex flex-col gap-2 pr-4">
        {availableProducts.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onAddProduct(product)}
            className="group flex items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.98]"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="56px"
                className="object-contain p-1"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-snug text-foreground">
                {product.name}
              </span>
              {product.deals?.length > 0 ? (
                product.deals[0].availability ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">
                      {priceFormatter.format(
                        priceCalculator(
                          product.deals[0].price,
                          product.deals[0].coupon?.availability
                            ? product.deals[0].coupon.discount
                            : undefined,
                          product.deals[0].cashback?.value,
                          product.deals[0].discounts.map((d) => d.discount),
                        ) / 100,
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      via {product.deals[0].retailer.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-destructive">
                    Indisponível
                  </span>
                )
              ) : (
                <span className="text-sm font-bold text-warning">
                  Não listado
                </span>
              )}
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-opacity group-hover:opacity-100">
              <Plus className="size-4" />
            </div>
          </button>
        ))}

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
            hidden={!hasMore}
            onChange={(_, entry) => {
              if (entry.isIntersecting) onEntry()
            }}
          />
        )}
      </div>
    </ScrollArea>
  )
}
