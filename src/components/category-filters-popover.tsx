'use client'

import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { useQueryString } from '@/hooks/use-query-string'
import { cn } from '@/lib/utils'
import { type Filter } from '@/types'
import { Icons } from './icons'
import { Badge } from './ui/badge'
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Separator } from './ui/separator'

interface CategoryFiltersPopoverProps {
  categoryFilter: Pick<Filter, 'name' | 'slug'> & {
    options: Pick<Filter['options'][0], 'value' | 'slug'>[]
  }
  initialFilterOptions: string[]
}

export function CategoryFilterPopover({
  categoryFilter,
  initialFilterOptions,
}: CategoryFiltersPopoverProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = React.useTransition()
  const { createQueryString } = useQueryString()

  const options = new Set(initialFilterOptions)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size={'sm'} className="border-dashed">
          <Icons.PlusCircle className="mr-2 h-4 w-4" />
          {categoryFilter.name}
          {options.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal xl:hidden"
              >
                {isPending ? (
                  <Icons.Spinner className="h-4 w-4 animate-spin" />
                ) : (
                  `${options.size}`
                )}
              </Badge>
              <div className="hidden space-x-1 xl:flex">
                {options.size > 1 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {isPending ? (
                      <Icons.Spinner className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      `${options.size}`
                    )}{' '}
                    selecionado(s)
                  </Badge>
                ) : (
                  categoryFilter.options
                    .filter((option) => options.has(option.slug))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.slug}
                        className="max-w-[300px] truncate rounded-sm px-1 font-normal"
                      >
                        {option.value}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={categoryFilter.name} />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {categoryFilter.options.map((option) => {
                const isSelected = options.has(option.slug)
                return (
                  <CommandItem
                    key={option.slug}
                    disabled={isPending}
                    className={cn({ 'opacity-60': isPending })}
                    onSelect={() => {
                      const setted = options.has(option.slug)
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
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Icons.Check className="h-4 w-4" />
                    </div>

                    <span>{option.value}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {options.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      startTransition(() => {
                        startTransition(() => {
                          router.push(
                            `${pathname}?${createQueryString({
                              page: null,
                              [categoryFilter.slug]: null,
                            })}`,
                          )
                        })
                      })
                    }}
                    className="justify-center text-center text-sm"
                  >
                    Limpar
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
