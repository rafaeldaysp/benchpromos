'use client'

import { gql, useQuery } from '@apollo/client'
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
import { Skeleton } from '../ui/skeleton'

const GET_BENCHMARK_RESULTS = gql`
  query GetBenchmarks($benchmarkSlug: ID) {
    benchmarkResults(benchmarkSlug: $benchmarkSlug) {
      result
      description
      product {
        name
      }
    }
  }
`

interface BenchmarkChartProps {
  benchmarkSlug: string
}

export function BenchmarkChart({ benchmarkSlug }: BenchmarkChartProps) {
  const { data, loading: isLoading } = useQuery<{
    benchmarkResults: {
      result: number
      description?: string
      product: {
        name: string
      }
    }[]
  }>(GET_BENCHMARK_RESULTS, {
    variables: {
      benchmarkSlug,
    },
  })

  const results = data?.benchmarkResults

  if (isLoading) return <Skeleton className="h-4 w-full" />

  return (
    <BarChart
      width={500}
      height={400}
      data={results}
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
        label={RenderCustomBarLabel}
      >
        {/* <LabelList dataKey="result" /> */}
      </Bar>
    </BarChart>
  )
}

// @ts-expect-error ...
const RenderCustomBarLabel = ({ x, y, width, height, value }) => {
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
