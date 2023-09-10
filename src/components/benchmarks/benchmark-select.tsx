'use client'

import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import { useQueryString } from '@/hooks/use-query-string'
import { cn } from '@/lib/utils'
import { Icons } from '../icons'
import { Button } from '../ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface BenchmarkSelectProps {
  benchmarks: {
    slug: string
    name: string
  }[]
  selectedBenchmark?: { slug: string; name: string }
  selectedIndex: number
}

export function BenchmarkSelect({
  benchmarks,
  selectedBenchmark,
  selectedIndex,
}: BenchmarkSelectProps) {
  const [isPending, startTransition] = React.useTransition()
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { createQueryString } = useQueryString()

  function BenchmarkCommand({ className }: { className?: string }) {
    return (
      <Command className={className} loop>
        <CommandInput placeholder="Procurar benchmark..." />
        <CommandEmpty>Nenhum benchmark encontrado.</CommandEmpty>
        <CommandGroup>
          {benchmarks.map((benchmark) => (
            <CommandItem
              key={benchmark.slug}
              value={benchmark.name}
              onSelectCapture={(e) => e.preventDefault()}
              className={cn(
                'hover:bg-muted/50 hover:underline aria-selected:bg-background',
                {
                  'bg-muted aria-selected:bg-muted hover:bg-muted':
                    selectedBenchmark?.slug === benchmark.slug,
                },
              )}
              onSelect={() =>
                startTransition(() => {
                  setOpen(false)
                  router.push(
                    `${pathname}?${createQueryString({
                      benchmark: benchmark.slug,
                    })}`,
                  )
                })
              }
            >
              {isPending ? (
                <Icons.Spinner
                  className={cn(
                    'mr-2 h-4 w-4 animate-spin',
                    selectedBenchmark?.slug === benchmark.slug
                      ? 'opacity-100'
                      : 'opacity-0',
                  )}
                />
              ) : (
                <Icons.Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedBenchmark?.slug === benchmark.slug
                      ? 'opacity-100'
                      : 'opacity-0',
                  )}
                />
              )}

              {benchmark.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    )
  }

  return (
    <div className="space-y-5">
      <BenchmarkCommand className="hidden lg:block" />
      <div className="flex w-full space-x-2 lg:hidden lg:space-x-0">
        <Button
          variant={'outline'}
          disabled={selectedIndex < 1 || isPending}
          className="lg:hidden"
          onClick={() =>
            startTransition(() => {
              router.push(
                `${pathname}?${createQueryString({
                  benchmark: benchmarks[selectedIndex - 1].slug,
                })}`,
              )
            })
          }
        >
          <Icons.ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant={'outline'}
          disabled={selectedIndex === benchmarks.length - 1 || isPending}
          className="order-3 lg:hidden"
          onClick={() =>
            startTransition(() => {
              router.push(
                `${pathname}?${createQueryString({
                  benchmark: benchmarks[selectedIndex + 1].slug,
                })}`,
              )
            })
          }
        >
          <Icons.ChevronRight className="h-4 w-4" />
        </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              disabled={isPending}
              aria-expanded={open}
              className="w-full px-1 text-sm sm:px-4"
            >
              <span className="line-clamp-1">
                {selectedBenchmark
                  ? benchmarks.find(
                      (benchmark) => benchmark.slug === selectedBenchmark.slug,
                    )?.name
                  : 'Selecione um benchmark...'}
              </span>

              {isPending ? (
                <Icons.Spinner className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
              ) : (
                <Icons.ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-lg p-0">
            <BenchmarkCommand />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
