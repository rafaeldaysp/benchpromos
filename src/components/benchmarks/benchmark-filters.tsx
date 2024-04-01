'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { notebooksCustomFilters } from '@/constants'
import { useQueryString } from '@/hooks/use-query-string'
import { type Filter } from '@/types'
import { Icons } from '../icons'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { Switch } from '../ui/switch'
import { Toggle } from '../ui/toggle'

interface BenchmarkFiltersProps {
  filters: Pick<Filter, 'slug' | 'name' | 'options'>[]
}

export function BenchmarkFilters({ filters }: BenchmarkFiltersProps) {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()
  const pathname = usePathname()
  const router = useRouter()

  const initialFilters = filters
    .map((filter) => ({
      slug: filter.slug,
      options: searchParams.get(filter.slug)?.split('.'),
    }))
    .filter((filter) => filter.options)

  const [paramsFilters, setParamsFilters] = React.useState(initialFilters)

  const { createQueryString } = useQueryString()

  const filterSlugNullRecord: Record<string, null> = {}
  filters.forEach((filter) => {
    filterSlugNullRecord[filter.slug] = null
  })

  React.useEffect(() => {
    setParamsFilters(initialFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="w-full">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            aria-label="Filtrar produtos"
            variant="secondary"
            className="w-full"
          >
            <Icons.SlidersHorizontal className="mr-2 h-4 w-4" />
            <span className="text-sm">Filtros</span>
            {initialFilters.length > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {initialFilters.length}
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
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="space-y-10 px-4">
              {filters
                .filter((filter) => filter.options.length > 0)
                .map((filter) => {
                  const targetFilter = paramsFilters?.find(
                    (paramFilter) => filter.slug === paramFilter.slug,
                  )

                  return (
                    <div key={filter.slug} className="space-y-2">
                      <h3 className="font-medium tracking-wide text-foreground">
                        {filter.name}
                      </h3>
                      <div className="flex flex-wrap gap-2.5">
                        {filter.options.map((option) => {
                          const options = new Set(targetFilter?.options)
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
                                      [filter.slug]: value,
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
              <div className="space-y-4">
                <h3 className="font-medium tracking-wide text-foreground">
                  Mais filtros
                </h3>
                {notebooksCustomFilters.map((customFilter) => (
                  <div
                    key={customFilter.slug}
                    className="flex items-center justify-between gap-x-2"
                  >
                    <Label className="text-sm" htmlFor={customFilter.slug}>
                      {customFilter.label}
                    </Label>
                    <Switch
                      id={customFilter.slug}
                      defaultChecked={
                        searchParams.get(customFilter.slug) ? true : false
                      }
                      onCheckedChange={(value) =>
                        startTransition(() => {
                          router.push(
                            `${pathname}?${createQueryString({
                              [customFilter.slug]: value ? 'true' : null,
                            })}`,
                          )
                        })
                      }
                    />
                  </div>
                ))}
              </div>
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
              Limpar Filtros
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
