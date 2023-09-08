'use client'

import { gql, useQuery } from '@apollo/client'
import { useSearchParams } from 'next/navigation'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
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
    <ResponsiveContainer
      height={50 + 60 * (results ? results.length : 0)}
      className={'w-full select-none text-sm'}
    >
      <BarChart
        data={results}
        // height={50 + 70 * (results ? results.length : 0)}
        barSize={30}
        layout="vertical"
        // margin={{
        //   left: 100,
        // }}
      >
        <XAxis
          allowDataOverflow
          dataKey="result"
          interval="preserveEnd"
          // padding={{
          //   left: 5,
          // }}
          tickLine={false}
          tickCount={5}
          type="number"
          axisLine={false}
        />
        <YAxis dataKey="product['name']" width={100} type="category" />
        <Legend iconType="rect" />
        <Tooltip
          labelStyle={{ color: '--primary' }}
          contentStyle={{ backgroundColor: '#262626' }}
          cursor={false}
        />
        <CartesianGrid horizontal={false} />
        <Bar
          dataKey="result"
          fill="#6d28d9"
          // className="bg-primary fill-primary text-primary"
          label={RenderCustomBarLabel}
          name="Resultado"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

// @ts-expect-error ...
const RenderCustomBarLabel = ({ x, y, width, height, value }) => {
  return (
    <text
      x={x + width - 20}
      y={y + height / 2 + 5}
      className="fill-primary-foreground font-semibold"
      textAnchor="middle"
    >
      {value}
    </text>
  )
}
