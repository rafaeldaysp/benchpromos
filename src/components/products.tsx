'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { Pagination } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import type { Category, Filter, Product } from '@/types'

interface ProductsProps {
  products: (Product & { category: Pick<Category, 'slug'> })[]
  pageCount: number
  categoryFilters: Filter[]
  filters: { slug: string; options: string[] }[]
}

export function Products({
  products,
  pageCount,
  categoryFilters,
  filters: initialFilters,
}: ProductsProps) {
  const searchParams = useSearchParams()
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 500])
  const debouncedPrice = useDebounce(priceRange, 500)
  const [filters, setFilters] = React.useState(initialFilters)
  const [isPending, startTransition] = React.useTransition()
  const pathname = usePathname()
  const router = useRouter()

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
  }, [initialFilters])

  return (
    <div className="space-y-6">
      <div>
        <Sheet>
          <SheetTrigger asChild>
            <Button aria-label="Filtrar produtos">Filtros</Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col px-0">
            <SheetHeader className="px-4">
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="space-y-10 px-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium tracking-wide text-foreground">
                    Preços ($)
                  </h3>
                  <Slider />
                  <div className="flex items-center space-x-4">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={priceRange[1]}
                      className="h-9"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setPriceRange([value, priceRange[1]])
                      }}
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={priceRange[0]}
                      max={500}
                      className="h-9"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setPriceRange([priceRange[0], value])
                      }}
                    />
                  </div>
                </div>
                {categoryFilters
                  .filter((categoryFilter) => categoryFilter.options.length)
                  .map((categoryFilter) => {
                    const filter = filters.find(
                      (filter) => filter.slug === categoryFilter.slug,
                    )

                    return (
                      <div key={categoryFilter.id}>
                        <h3 className="text-sm font-medium tracking-wide text-foreground">
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
                      router.push(pathname)
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
      <div className="grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            className="max-w-xs"
          />
        ))}
      </div>
      {products.length && (
        <Pagination page={Number(page)} pageCount={pageCount} />
      )}
    </div>
  )
}
