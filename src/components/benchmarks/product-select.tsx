'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
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
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { Checkbox } from '../ui/checkbox'
import { ScrollArea } from '../ui/scroll-area'
import { useQueryString } from '@/hooks/use-query-string'
import { Badge } from '../ui/badge'

type SearchedProduct = {
  name: string
  imageUrl: string
  slug: string
  category: {
    name: string
  }
  subcategory: {
    name: string
  }
}

interface ProductSelectProps {
  products: {
    name: string
    slug: string
    imageUrl: string
    category: { name: string }
    subcategory: { name: string }
  }[]
}

export function ProductSelect({ products }: ProductSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const debouncedQuery = useDebounce(query, 200)
  const [selectedProducts, setSelectedProducts] = React.useState<
    SearchedProduct[]
  >([])
  const [displayedProducts, setDisplayedProducts] = React.useState<
    SearchedProduct[]
  >([])
  const router = useRouter()
  const { createQueryString } = useQueryString()

  React.useEffect(() => {
    if (debouncedQuery.trim().length === 0) setDisplayedProducts(products)

    if (debouncedQuery.trim().length > 1) {
      const searchArray = debouncedQuery.trim().toLowerCase().split(' ')
      setDisplayedProducts(
        products.filter((product) => {
          return searchArray.every(
            (search) =>
              product.name.toLowerCase().includes(search) ||
              product.category.name.toLowerCase().includes(search) ||
              product.subcategory.name.toLowerCase().includes(search),
          )
        }),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const handleSelect = React.useCallback((callback: () => unknown) => {
    setIsOpen(false)
    callback()
  }, [])
  const pathname = usePathname()
  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full border-dashed sm:w-full"
      >
        <Icons.PlusCircle className="mr-2 h-4 w-4" />
        Produtos
        {selectedProducts.length > 0 && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge
              variant="secondary"
              className="rounded-sm px-1 font-normal xl:hidden"
            >
              {selectedProducts.length}
            </Badge>
            <div className="hidden space-x-1 xl:flex">
              {selectedProducts.length > 1 ? (
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {selectedProducts.length} selecionado(s)
                </Badge>
              ) : (
                selectedProducts.map((product) => (
                  <Badge
                    variant="secondary"
                    key={product.slug}
                    className="max-w-[300px] truncate rounded-sm px-1 font-normal"
                  >
                    {product.name}
                  </Badge>
                ))
              )}
            </div>
          </>
        )}
      </Button>

      <CommandDialog
        open={isOpen}
        onOpenChange={(value) => {
          setIsOpen(value)
          handleSelect(() => {
            if (selectedProducts.length === products.length) {
              router.push(
                `${pathname}?${createQueryString({ products: null })}`,
              )
              return
            }
            router.push(
              `${pathname}?${createQueryString({
                products:
                  selectedProducts.length > 0
                    ? selectedProducts.map((s) => s.slug).join('.')
                    : null,
              })}`,
            )
          })
        }}
      >
        <CommandInput
          placeholder="Selecionar produtos..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty className="py-6 text-center text-sm">
            Nenhum produto encontrado.
          </CommandEmpty>

          {products.length === 0 ? (
            <div className="space-y-1 overflow-hidden px-1 py-2">
              <Skeleton className="h-20 rounded-sm" />
              <Skeleton className="h-20 rounded-sm" />
            </div>
          ) : (
            <>
              <Separator />
              {displayedProducts.length > 0 && (
                <ScrollArea className="sm:max-h-[400px]">
                  <CommandGroup heading="Produtos">
                    {displayedProducts?.map((product) => (
                      <CommandItem
                        key={product.slug}
                        value={`${product.name} ${product.category.name} ${product.subcategory.name}`}
                        className={cn(
                          'h-16 space-x-4 transition-colors aria-selected:bg-accent/50',
                          {
                            'bg-accent aria-selected:bg-accent/80':
                              selectedProducts.some(
                                (p) => p.slug === product.slug,
                              ),
                          },
                        )}
                        onSelect={() => {
                          setSelectedProducts((prev) =>
                            prev.some((p) => p.slug === product.slug)
                              ? prev.filter((p) => p.slug !== product.slug)
                              : [...prev, product],
                          )
                        }}
                      >
                        <div>
                          <Checkbox
                            checked={selectedProducts?.some(
                              (p) => p.slug === product.slug,
                            )}
                            aria-label="Selecionar"
                            className="flex translate-y-[2px] items-center justify-center border-black data-[state=checked]:translate-y-0 data-[state=checked]:bg-black data-[state=checked]:text-white dark:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                          />
                        </div>
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
                </ScrollArea>
              )}
            </>
          )}
          <Separator />
        </CommandList>
        <div className="flex items-center justify-between p-1">
          <Button
            variant={'ghost'}
            onClick={() => setSelectedProducts(products)}
          >
            <Icons.PlusCircle className="mr-2 h-4 w-4" />
            Todos
          </Button>
          <Button variant={'ghost'} onClick={() => setSelectedProducts([])}>
            <Icons.MinusCircle className="mr-2 h-4 w-4" />
            Nenhum
          </Button>

          {/* <Button
            variant={'ghost'}
            onClick={() =>
              handleSelect(() => {
                router.push(
                  `${pathname}?${createQueryString({
                    products:
                      selectedProducts.length > 0
                        ? selectedProducts.map((s) => s.slug).join('.')
                        : null,
                  })}`,
                )
              })
            }
          >
            <Icons.Check className="mr-1 h-4 w-4" />
            Confirmar
          </Button> */}
        </div>
      </CommandDialog>
    </>
  )
}
