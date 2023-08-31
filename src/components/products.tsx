'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { Icons } from '@/components/icons'
import { Pagination } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Toggle } from '@/components/ui/toggle'
import { useDebounce } from '@/hooks/use-debounce'
import type {
  Cashback,
  Category,
  Coupon,
  Deal,
  Filter,
  Product,
  Retailer,
} from '@/types'

interface ProductsProps {
  products: (Product & {
    category: Pick<Category, 'slug'>
    deals: (Pick<
      Deal,
      'price' | 'availability' | 'installments' | 'totalInstallmentPrice'
    > & { retailer: Pick<Retailer, 'name'> } & {
      coupon: Pick<Coupon, 'code' | 'discount'>
    } & { cashback: Pick<Cashback, 'value' | 'provider'> })[]
  })[]
  pageCount: number
  productCount: number
  categoryFilters: Filter[]
  filters: { slug: string; options: string[] }[]
  serverPriceRange: [number, number]
  sort?: string
  limit?: string
  search?: string
}

export function Products({
  products,
  pageCount,
  productCount,
  categoryFilters,
  filters: initialFilters,
  serverPriceRange,
  sort: initialSort,
  limit: initialLimit,
  search,
}: ProductsProps) {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()
  const pathname = usePathname()
  const router = useRouter()
  const [filters, setFilters] = React.useState(initialFilters)
  const [sort, setSort] = React.useState(initialSort)
  const [limit, setLimit] = React.useState(initialLimit)

  const clientPriceRange = searchParams
    .get('price')
    ?.split('-')
    .map(Number) as [number, number]
  const [currentPriceRange, setCurrentPriceRange] = React.useState<
    [number, number]
  >(clientPriceRange ?? serverPriceRange)
  const debouncedPrice = useDebounce(currentPriceRange, 250)

  const page = searchParams.get('page') ?? '1'

  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString())

      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, String(value))
        }
      }

      return newSearchParams.toString()
    },
    [searchParams],
  )

  React.useEffect(() => {
    setFilters(initialFilters)
    setCurrentPriceRange(clientPriceRange ?? serverPriceRange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters])

  React.useEffect(() => {
    const [min, max] = debouncedPrice

    if (
      min === serverPriceRange[0] &&
      max === serverPriceRange[1] &&
      !clientPriceRange
    )
      return

    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          price: `${min}-${max}`,
        })}`,
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPrice])

  React.useEffect(() => {
    if (!sort) return

    React.startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          sort,
        })}`,
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort])

  React.useEffect(() => {
    if (!limit) return

    React.startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          limit,
        })}`,
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit])

  return (
    <div className="space-y-6">
      <div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              aria-label="Filtrar produtos"
              variant="outline"
              className="rounded-full"
            >
              <Icons.SlidersHorizontal className="mr-2 h-4 w-4" />
              <span>Filtros</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-full flex-col px-0 sm:max-w-md"
          >
            <SheetHeader className="px-4">
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="space-y-10 px-4">
                {serverPriceRange[0] !== serverPriceRange[1] && (
                  <div className="space-y-4">
                    <h3 className="font-medium tracking-wide text-foreground">
                      Preços (R$)
                    </h3>
                    <Slider
                      variant="range"
                      value={currentPriceRange}
                      min={serverPriceRange[0]}
                      max={serverPriceRange[1]}
                      step={1}
                      onValueChange={(value: typeof currentPriceRange) => {
                        setCurrentPriceRange(value)
                      }}
                    />
                    <div className="flex items-center space-x-4">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={serverPriceRange[0]}
                        max={serverPriceRange[1]}
                        className="h-9"
                        value={currentPriceRange[0]}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          setCurrentPriceRange([value, currentPriceRange[1]])
                        }}
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={serverPriceRange[0]}
                        max={serverPriceRange[1]}
                        className="h-9"
                        value={currentPriceRange[1]}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          setCurrentPriceRange([currentPriceRange[0], value])
                        }}
                      />
                    </div>
                  </div>
                )}
                {categoryFilters
                  .filter((categoryFilter) => categoryFilter.options.length)
                  .map((categoryFilter) => {
                    const filter = filters.find(
                      (filter) => filter.slug === categoryFilter.slug,
                    )

                    return (
                      <div key={categoryFilter.id} className="space-y-2">
                        <h3 className="font-medium tracking-wide text-foreground">
                          {categoryFilter.name}
                        </h3>
                        <div className="flex flex-wrap gap-2.5">
                          {categoryFilter.options.map((option) => {
                            const options = new Set(filter?.options)

                            const setted = options.has(option.slug)

                            return (
                              <Toggle
                                key={option.id}
                                variant="outline"
                                size="sm"
                                pressed={setted}
                                className="rounded-full"
                                onClick={() => {
                                  startTransition(() => {
                                    if (setted) {
                                      options.delete(option.slug)
                                    } else {
                                      options.add(option.slug)
                                    }

                                    const value = options.size
                                      ? Array.from(options).join('.')
                                      : null

                                    router.push(
                                      `${pathname}?${createQueryString({
                                        page: null,
                                        [categoryFilter.slug]: value,
                                      })}`,
                                    )
                                  })
                                }}
                              >
                                {option.value}
                              </Toggle>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="px-4">
              <Button
                aria-label="Limpar filtros"
                size="sm"
                className="w-full"
                onClick={() => {
                  startTransition(() => {
                    startTransition(() => {
                      router.push(
                        pathname.concat(search ? `?search=${search}` : ''),
                      )
                    })
                  })
                }}
              >
                Limpar Filtros
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex justify-between">
        <div className="flex flex-1 items-center justify-between gap-x-4 lg:justify-normal">
          <div>{productCount} resultados</div>
          <Select
            defaultValue="relevance"
            value={sort}
            onValueChange={(value) => setSort(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevância</SelectItem>
              <SelectItem value="lowest">Menor Preço</SelectItem>
              <SelectItem value="highest">Maior Preço</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden items-center gap-x-4 lg:flex">
          <div>Produtos por página</div>
          <Select
            defaultValue="16"
            value={limit}
            onValueChange={(value) => setLimit(value)}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16">16</SelectItem>
              <SelectItem value="32">32</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {products.length && (
        <Pagination page={Number(page)} pageCount={pageCount} />
      )}
    </div>
  )
}
