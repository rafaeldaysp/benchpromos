'use client'

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface BenchmarkChartProps {
  benchmarks: {
    id: string
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

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryBenchmark = searchParams.get('benchmark')

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
      <Select
        onValueChange={(value) => {
          // setSelectedBenchmark(
          //   benchmarks.find((benchmark) => benchmark.id === value),
          // )
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
            <SelectItem key={benchmark.id} value={benchmark.id}>
              {benchmark.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
