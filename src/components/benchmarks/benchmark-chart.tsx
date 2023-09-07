'use client'

import { gql, useQuery } from '@apollo/client'
import { useSearchParams } from 'next/navigation'
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
  query GetBenchmarks($benchmarkSlug: ID, $productsSlugs: [String]) {
    benchmarkResults(
      benchmarkSlug: $benchmarkSlug
      productsSlugs: $productsSlugs
    ) {
      result
      description
      product {
        name
      }
    }
  }
`

export function BenchmarkChart() {
  const searchParams = useSearchParams()
  const benchmarkSlug = searchParams.get('benchmark')
  const productsString = searchParams.get('products')
  const productsSlugs = productsString?.split('.')

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
      productsSlugs,
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
