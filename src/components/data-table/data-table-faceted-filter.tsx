import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Check, PlusCircle } from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQueryString } from '@/hooks/use-query-string'
import { Icons } from '../icons'

interface DataTableFacetedFilter {
  title?: string
  options: {
    label: string
    value: string
    count: number
  }[]
}

export function DataTableFacetedFilter({
  title,
  options,
}: DataTableFacetedFilter) {
  const search = useSearchParams()
  const initialOptionsSelected = search.get('selected')

  const [selectedOptions, setSelectedOptions] = React.useState<string[]>(
    initialOptionsSelected?.split('.') ?? [],
  )
  const router = useRouter()
  const pathname = usePathname()
  const { createQueryString } = useQueryString()

  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    startTransition(() => {
      const selected =
        selectedOptions.length > 0 ? selectedOptions.join('.') : null

      router.push(
        `${pathname}?${createQueryString({
          page: 1,
          selected,
        })}`,
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptions])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedOptions.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal xl:hidden"
              >
                {isPending ? (
                  <Icons.Spinner className="h-4 w-4 animate-spin" />
                ) : (
                  `${selectedOptions.length}`
                )}
              </Badge>
            </>
          )}

          <div className="hidden space-x-1 xl:flex">
            {selectedOptions.length > 1 ? (
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {isPending ? (
                  <Icons.Spinner className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  `${selectedOptions.length}`
                )}{' '}
                selecionado(s)
              </Badge>
            ) : (
              options
                .filter((option) => selectedOptions.includes(option.value))
                .map((option) => (
                  <Badge
                    variant="secondary"
                    key={option.value}
                    className="max-w-[300px] truncate rounded-sm px-1 font-normal"
                  >
                    {option.label}
                  </Badge>
                ))
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-80">
                {options.map((option) => {
                  const isSelected = selectedOptions.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      disabled={isPending}
                      className={cn({ 'opacity-60': isPending })}
                      onSelect={() => {
                        if (isSelected) {
                          setSelectedOptions((prev) =>
                            prev.filter((value) => value !== option.value),
                          )
                        } else {
                          setSelectedOptions((prev) => [...prev, option.value])
                        }
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
                        <Check className="h-4 w-4" />
                      </div>

                      <span>{option.label}</span>
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {option.count}
                      </span>
                    </CommandItem>
                  )
                })}
              </ScrollArea>
            </CommandGroup>
            {selectedOptions.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setSelectedOptions([])}
                    className="justify-center text-center"
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
