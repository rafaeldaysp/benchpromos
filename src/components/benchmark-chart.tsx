'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '@/lib/utils'
import { Icons } from './icons'
import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

interface BenchmarkChartProps {
  benchmarks: {
    id: string
    slug: string
    name: string
    results: {
      result: number
      description?: string
      product: {
        name: string
      }
    }[]
  }[]
}

export function BenchmarkChart({ benchmarks }: BenchmarkChartProps) {
  const [selectedBenchark, setSelectedBenchmark] =
    React.useState<(typeof benchmarks)[number]>()

  const [open, setOpen] = React.useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const queryBenchmark = searchParams.get('benchmark')
    setSelectedBenchmark(
      benchmarks.find((benchmark) => benchmark.slug === queryBenchmark),
    )
    console.log(queryBenchmark)
  }, [searchParams, benchmarks])

  const createQueryString = React.useCallback(
    (params: Record<string, string | null>) => {
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

  return (
    <div className="space-y-5">
      {/* <Select
        value={selectedBenchark?.slug}
        onValueChange={(value) => {
          setSelectedBenchmark(
            benchmarks.find((benchmark) => benchmark.slug === value),
          )
          router.push(
            `${pathname}?${createQueryString({
              benchmark: value,
            })}`,
          )
        }}
      >
        <SelectTrigger className="h-8 w-fit">
          <SelectValue placeholder="Selecione um benchmark" />
        </SelectTrigger>
        <SelectContent side="top">
          {benchmarks.map((benchmark) => (
            <SelectItem key={benchmark.id} value={benchmark.slug}>
              {benchmark.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> */}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[400px] justify-between"
          >
            {selectedBenchark
              ? benchmarks.find(
                  (benchmark) => benchmark.id === selectedBenchark.id,
                )?.name
              : 'Selecione um benchmark...'}
            <Icons.ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Procurar benchmark..." />
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {benchmarks.map((benchmark) => (
                <CommandItem
                  key={benchmark.id}
                  value={benchmark.name}
                  onSelect={(currentValue) => {
                    setSelectedBenchmark(
                      currentValue === selectedBenchark?.name
                        ? undefined
                        : benchmark,
                    )
                    setOpen(false)
                    router.push(
                      `${pathname}?${createQueryString({
                        benchmark: benchmark.slug,
                      })}`,
                    )
                  }}
                >
                  <Icons.Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedBenchark?.id === benchmark.id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  {benchmark.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedBenchark && (
        <BarChart
          width={500}
          height={400}
          data={selectedBenchark.results}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={40}
          layout="vertical"
        >
          <XAxis scale="linear" tickCount={5} axisLine={false} type="number" />
          <YAxis type="category" width={100} dataKey="product['name']" />
          <Tooltip labelStyle={{ color: 'black' }} />
          <Legend />
          <CartesianGrid strokeDasharray="3 3" color="#ffffff" />
          <Bar
            dataKey="result"
            className="fill-primary"
            radius={2}
            label={renderCustomBarLabel}
          >
            {/* <LabelList dataKey="result" /> */}
          </Bar>
        </BarChart>
      )}
    </div>
  )
}

// @ts-expect-error ...
const renderCustomBarLabel = ({ x, y, width, height, value }) => {
  return (
    <text
      x={x + width - 15}
      y={y + height / 2 + 5}
      className="fill-primary-foreground"
      textAnchor="middle"
    >
      {value}
    </text>
  )
}
