'use client'

import { useDebounce } from '@/hooks/use-debounce'
import { gql, useQuery } from '@apollo/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const GET_PRODUCTS_BY_SEARCH = gql`
  query GetProductsBySearch($input: GetProductsInput) {
    productsList: products(getProductsInput: $input) {
      categorySlug: slug
      products {
        id
        name
        imageUrl
        slug
        category {
          name
          slug
        }
        subcategory {
          name
        }
      }
    }
  }
`

type SearchedProduct = {
  id: string
  name: string
  imageUrl: string
  slug: string
  category: {
    name: string
    slug: string
  }
  subcategory: {
    name: string
  }
}

export function Combobox() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const debouncedQuery = useDebounce(query, 200)
  const [data, setData] = React.useState<{
    categorySlug: string
    products: SearchedProduct[]
  } | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  const { refetch } = useQuery<{
    productsList: {
      categorySlug: string
      products: SearchedProduct[]
    }
  }>(GET_PRODUCTS_BY_SEARCH, {
    skip: true,
    fetchPolicy: 'network-only',
    refetchWritePolicy: 'overwrite',
  })

  const products = data?.products ?? []

  React.useEffect(() => {
    if (debouncedQuery.trim().length === 0) setData(null)

    if (debouncedQuery.trim().length > 1) {
      startTransition(async () => {
        const { data } = await refetch({
          input: {
            search: debouncedQuery,
            sortBy: 'relevance',
            pagination: {
              limit: 5,
              page: 1,
            },
          },
        })
        setData({
          categorySlug: data.productsList.categorySlug,
          products: data.productsList.products,
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((isOpen) => !isOpen)
        setQuery((prev) => prev.trim())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelect = React.useCallback((callback: () => unknown) => {
    setIsOpen(false)
    callback()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-[250px] xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setIsOpen(true)}
      >
        <Icons.Search className="h-4 w-4 xl:mr-2" aria-hidden="true" />
        <div className="hidden w-[78%] xl:block">
          <span className="line-clamp-1 break-all text-start">
            {query.trim().length > 0 ? query : 'Procurar produtos...'}
          </span>
        </div>
        <span className="sr-only">Procurar produtos</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </Button>
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Procurar produtos..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty
            className={cn(isPending ? 'hidden' : 'py-6 text-center text-sm')}
          >
            Nenhum produto encontrado.
          </CommandEmpty>
          {isPending && products.length === 0 ? (
            <div className="space-y-1 overflow-hidden px-1 py-2">
              <Skeleton className="h-20 rounded-sm" />
              <Skeleton className="h-20 rounded-sm" />
            </div>
          ) : (
            products.length > 0 && (
              <>
                <CommandGroup heading="Pesquisar">
                  <CommandItem
                    value={query}
                    className="h-16"
                    onSelect={() => {
                      if (data?.categorySlug)
                        handleSelect(() =>
                          router.push(
                            `/${data.categorySlug}?search=${query}&includeNoDeals=true&includeUnavailable=true`,
                          ),
                        )
                    }}
                  >
                    <Icons.Search className="mr-2" />
                    <span>
                      Procurar por: <strong>{query}</strong>
                    </span>
                  </CommandItem>
                </CommandGroup>
                <Separator />
                <CommandGroup heading="Sugestões">
                  {products?.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.name} ${product.category.name} ${product.subcategory?.name}`}
                      className="h-16 space-x-4"
                      onSelect={() =>
                        handleSelect(() =>
                          router.push(
                            `/${product.category.slug}/${product.slug}`,
                          ),
                        )
                      }
                    >
                      <div className="relative aspect-square h-full">
                        <Image
                          src={product.imageUrl}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-contain"
                        />
                      </div>

                      <span className="line-clamp-2">{product.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
