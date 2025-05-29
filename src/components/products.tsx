'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { Icons } from '@/components/icons'
import { Pagination } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
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
import { useQueryString } from '@/hooks/use-query-string'
import { cn } from '@/lib/utils'
import type {
  Cashback,
  Category,
  Coupon,
  Deal,
  Discount,
  Filter,
  Product,
  Retailer,
} from '@/types'
import { CategoryFilterPopover } from './category-filters-popover'
import { PriceInput } from './price-input'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Switch } from './ui/switch'

interface ProductsProps {
  products: (Product & {
    category: Pick<Category, 'slug'>
    deals: (Pick<
      Deal,
      'price' | 'availability' | 'installments' | 'totalInstallmentPrice'
    > & { retailer: Pick<Retailer, 'name'> } & {
      coupon: Pick<Coupon, 'code' | 'discount' | 'availability'>
    } & { cashback: Pick<Cashback, 'value' | 'provider'> } & {
      discounts: Discount[]
    })[]
  })[]
  pageCount: number
  productCount: number
  categoryFilters: Filter[]
  filters: { slug: string; options: string[] }[]
  serverPriceRange: [number, number]
  subcategories?: { id: string; name: string; slug: string }[]
  subcategory?: string
  sort?: string
  limit?: string
  onlyInstallments?: boolean
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
  subcategories,
  onlyInstallments: initialOnlyInstallments = false,
}: ProductsProps) {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()
  const pathname = usePathname()
  const router = useRouter()

  const [filters, setFilters] = React.useState(initialFilters)
  const [limit, setLimit] = React.useState(initialLimit)
  const [selectIsOpen, setSelectIsOpen] = React.useState(false)

  const { createQueryString } = useQueryString()

  const clientPriceRange = searchParams
    .get('price')
    ?.split('-')
    .map((value) => Number(value) / 100) as [number, number]
  const [sort, setSort] = React.useState(initialSort)
  const [currentPriceRange, setCurrentPriceRange] = React.useState<
    [number, number]
  >(clientPriceRange ?? serverPriceRange)
  // const debouncedPrice = useDebounce(currentPriceRange, 250)

  const page = searchParams.get('page') ?? '1'

  const [noDealSwitch, setNoDealSwitch] = React.useState(false)
  const [installmentSwitch, setInstallmentSwitch] = React.useState(
    initialOnlyInstallments,
  )
  const [unavailableSwitch, setUnavailableSwitch] = React.useState(false)

  const filterSlugNullRecord: Record<string, null> = {}
  categoryFilters.forEach((filter) => {
    filterSlugNullRecord[filter.slug] = null
  })

  React.useEffect(() => {
    const includeNoDealsSelected = searchParams.get('includeNoDeals') === 'true'
    const includeUnavailableSelected =
      searchParams.get('includeUnavailable') === 'true'

    setUnavailableSwitch(includeUnavailableSelected)
    setNoDealSwitch(includeNoDealsSelected)
  }, [searchParams])

  React.useEffect(() => {
    setFilters(initialFilters)
    setCurrentPriceRange(clientPriceRange ?? serverPriceRange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters])

  // React.useEffect(() => {
  //   const [min, max] = debouncedPrice

  //   if (
  //     min === serverPriceRange[0] &&
  //     max === serverPriceRange[1] &&
  //     !clientPriceRange
  //   )
  //     return

  //   startTransition(() => {
  //     router.push(
  //       `${pathname}?${createQueryString({
  //         price: `${Number(min * 100)}-${Number(max * 100)}`,
  //       })}`,
  //     )
  //   })
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [debouncedPrice])

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
  }, [sort, setSort])

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
      <ScrollArea className="w-full bg-background pb-2.5">
        <div className="flex items-center space-x-2 ">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label="Filtrar produtos"
                variant="secondary"
                size={'sm'}
              >
                <Icons.SlidersHorizontal className="mr-2 h-4 w-4" />
                <span className="text-sm">Filters</span>
                {filters.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {filters.length}
                    </Badge>
                  </>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-full flex-col px-0 sm:max-w-md"
            >
              <SheetHeader className="px-4">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <Separator />
              <ScrollArea className="flex-1">
                <div className="space-y-10 px-4">
                  {serverPriceRange[0] !== serverPriceRange[1] && (
                    <div className="space-y-4">
                      <h3 className="font-medium tracking-wide text-foreground">
                        Prices (USD)
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
                        <PriceInput
                          min={serverPriceRange[0]}
                          max={serverPriceRange[1]}
                          className="h-9"
                          value={currentPriceRange[0]}
                          onValueChange={({ floatValue }) => {
                            setCurrentPriceRange((prev) => [
                              Number(~~(floatValue ?? 0)),
                              prev[1],
                            ])
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          to
                        </span>
                        <PriceInput
                          min={serverPriceRange[0]}
                          max={serverPriceRange[1]}
                          className="h-9"
                          value={currentPriceRange[1]}
                          onValueChange={({ floatValue }) => {
                            setCurrentPriceRange((prev) => [
                              prev[0],
                              Number(~~(floatValue ?? 0)),
                            ])
                          }}
                        />
                        <Button
                          variant={'outline'}
                          onClick={() =>
                            startTransition(() => {
                              router.push(
                                `${pathname}?${createQueryString({
                                  price: `${Number(
                                    currentPriceRange[0] * 100,
                                  )}-${Number(currentPriceRange[1] * 100)}`,
                                })}`,
                              )
                            })
                          }
                        >
                          Ok
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <h3 className="font-medium tracking-wide text-foreground">
                      Offers
                    </h3>
                    <div className="flex items-center justify-between gap-x-2">
                      <Label className="text-sm" htmlFor="hasDeals">
                        Show not listed
                      </Label>
                      <Switch
                        id="hasDeals"
                        checked={noDealSwitch}
                        onCheckedChange={(value) =>
                          startTransition(() => {
                            setNoDealSwitch(value)
                            router.push(
                              `${pathname}?${createQueryString({
                                includeNoDeals: value ? 'true' : null,
                                page: null,
                              })}`,
                            )
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-x-2">
                      <Label className="text-sm" htmlFor="unavailable">
                        Show unavailable
                      </Label>
                      <Switch
                        id="unavailable"
                        checked={unavailableSwitch}
                        onCheckedChange={(value) =>
                          startTransition(() => {
                            setUnavailableSwitch(value)
                            router.push(
                              `${pathname}?${createQueryString({
                                includeUnavailable: value ? 'true' : null,
                                page: null,
                              })}`,
                            )
                          })
                        }
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
                                  disabled={isPending}
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
                      router.push(
                        `${pathname}?${createQueryString({
                          ...filterSlugNullRecord,
                          page: null,
                        })}`,
                      )
                    })
                  }}
                >
                  Clear filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* <Separator
          orientation="vertical"
          className={cn('h-5', {
            hidden: categoryFilters.length === 0,
          })}
        /> */}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Filtrar preços"
                variant="secondary"
                size={'sm'}
              >
                <Icons.DollarSign className="mr-2 h-4 w-4" />
                <span className="text-sm">Prices</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full space-y-4 sm:w-fit">
              <h3 className="font-medium tracking-wide text-foreground">
                Prices (US$)
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
              <div className="flex items-center space-x-2">
                <PriceInput
                  min={serverPriceRange[0]}
                  max={serverPriceRange[1]}
                  className="h-9 w-24"
                  value={currentPriceRange[0]}
                  onValueChange={({ floatValue }) => {
                    setCurrentPriceRange((prev) => [
                      Number(~~(floatValue ?? 0)),
                      prev[1],
                    ])
                  }}
                />
                <span className="text-muted-foreground">to</span>
                <PriceInput
                  min={serverPriceRange[0]}
                  max={serverPriceRange[1]}
                  className="h-9 w-24"
                  value={currentPriceRange[1]}
                  onValueChange={({ floatValue }) => {
                    setCurrentPriceRange((prev) => [
                      prev[0],
                      Number(~~(floatValue ?? 0)),
                    ])
                  }}
                />
              </div>
              <div className="space-y-2">
                <Button
                  variant={'default'}
                  className="w-full"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      router.push(
                        `${pathname}?${createQueryString({
                          price: `${Number(
                            currentPriceRange[0] * 100,
                          )}-${Number(currentPriceRange[1] * 100)}`,
                        })}`,
                      )
                    })
                  }
                >
                  {isPending && (
                    <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Apply
                </Button>
                <Button
                  className="w-full"
                  variant={'outline'}
                  disabled={isPending}
                  onClick={() => {
                    startTransition(() => {
                      router.push(
                        `${pathname}?${createQueryString({
                          price: null,
                        })}`,
                      )
                    })
                  }}
                >
                  Reset
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {subcategories && subcategories.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  aria-label="Filtrar preços"
                  variant="secondary"
                  size={'sm'}
                >
                  <Icons.Menu className="mr-2 h-4 w-4" />
                  <span className="text-sm">Categories</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full space-y-4 sm:w-fit">
                <h3 className="font-medium tracking-wide text-foreground">
                  Categories
                </h3>
                <div className="w-52 space-y-1">
                  {subcategories?.map((subcategory) => (
                    <Button
                      key={subcategory.id}
                      className="w-full"
                      variant={'outline'}
                      onClick={() =>
                        startTransition(() => {
                          router.push(
                            `${pathname}?${createQueryString({
                              subcategory: subcategory.slug,
                            })}`,
                          )
                        })
                      }
                    >
                      {subcategory.name}
                    </Button>
                  ))}
                  <Button
                    className="w-full"
                    onClick={() =>
                      startTransition(() => {
                        router.push(
                          `${pathname}?${createQueryString({
                            subcategory: null,
                          })}`,
                        )
                      })
                    }
                  >
                    All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <div className="w-max space-x-2 font-medium">
            {categoryFilters
              .filter((filter) => filter.options.length > 0)
              .map((categoryFilter) => (
                <CategoryFilterPopover
                  key={categoryFilter.id}
                  categoryFilter={categoryFilter}
                  initialFilterOptions={
                    initialFilters.find(
                      (filter) => filter.slug === categoryFilter.slug,
                    )?.options ?? []
                  }
                />
              ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Separator />

      <div className="flex justify-between">
        <div className="flex flex-col items-center justify-between gap-4 max-sm:w-full sm:flex-row lg:justify-normal">
          <div className="flex w-full items-center justify-between gap-x-4 sm:justify-normal">
            <h3 className="whitespace-nowrap text-sm">
              {productCount ?? 0} result{productCount > 1 && 's'}
            </h3>
            <Select
              defaultValue="relevance"
              value={sort}
              onValueChange={(value) => setSort(value)}
              onOpenChange={(open) => {
                setTimeout(() => {
                  setSelectIsOpen(open)
                }, 100)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="lowest">Lowest price</SelectItem>
                <SelectItem value="highest">Highest price</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* <div className="flex w-full items-center justify-between gap-x-4 sm:justify-normal">
            <Label className="text-sm" htmlFor="installmentSwitch">
              Only installment
            </Label>
            <Switch
              id="installmentSwitch"
              checked={installmentSwitch}
              disabled={isPending}
              onCheckedChange={(value) =>
                startTransition(() => {
                  setInstallmentSwitch(value)
                  router.push(
                    `${pathname}?${createQueryString({
                      sortByInstallmentPrice: value ? 'true' : null,
                      page: null,
                    })}`,
                  )
                })
              }
            />
          </div> */}
        </div>

        <div className="hidden items-center gap-x-4 lg:flex">
          <h3 className="text-sm">Products per page</h3>
          <Select
            defaultValue="20"
            value={limit}
            onValueChange={(value) => setLimit(value)}
            onOpenChange={(open) => {
              setTimeout(() => {
                setSelectIsOpen(open)
              }, 100)
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent className="min-w-fit">
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        className={cn(
          'grid grid-cols-1 justify-center gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
          {
            'pointer-events-none': selectIsOpen,
          },
        )}
      >
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onlyInstallments={installmentSwitch}
          />
        ))}
      </div>
      {products?.length && (
        <Pagination page={Number(page)} pageCount={pageCount} />
      )}
    </div>
  )
}
