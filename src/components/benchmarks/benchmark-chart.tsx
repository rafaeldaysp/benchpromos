'use client'

import { gql, useQuery } from '@apollo/client'
import { useSearchParams } from 'next/navigation'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
} from 'recharts'

import { useMediaQuery } from '@/hooks/use-media-query'
import { useTheme } from 'next-themes'
import { Icons } from '../icons'
import { Card, CardContent, CardHeader } from '../ui/card'

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

  const isSm = useMediaQuery('(max-width: 640px)')
  const { theme } = useTheme()

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

  if (isLoading)
    return (
      // <div className="space-y-4 px-32">
      //   {Array.from({ length: 10 }).map((_, i) => (
      //     <Skeleton key={i} className="h-8 w-full pl-2" />
      //   ))}
      // </div>
      <div className="flex flex-1 justify-center">
        <Icons.Spinner className="h-4 w-4 animate-spin" />
      </div>
    )

  return (
    <ResponsiveContainer
      height={50 + 50 * (results ? results.length : 0)}
      width={'100%'}
    >
      <BarChart data={results} barSize={30} layout="vertical">
        <XAxis
          allowDataOverflow
          dataKey="result"
          interval="preserveEnd"
          tickLine={false}
          tickCount={5}
          type="number"
          axisLine={false}
          fontSize={14}
          fontWeight={500}
          stroke={theme === 'dark' ? '#fafafa' : '#0a0a0a'}
        />
        <YAxis
          dataKey="product['name']"
          tickLine={false}
          width={isSm ? 0 : 300}
          type="category"
          stroke={theme === 'dark' ? '#fafafa' : '#0a0a0a'}
          fontSize={14}
          fontWeight={500}
          axisLine={false}
        />

        <Tooltip cursor={false} content={<RenderCustomTooltip />} />
        <CartesianGrid
          stroke={theme === 'dark' ? '#fafafa' : '#0a0a0a'}
          strokeDasharray="3 3"
          horizontal={false}
        />
        <Bar
          dataKey="result"
          label={RenderCustomBarLabel}
          name="Resultado"
          radius={[0, 4, 4, 0]}
          fill="#6d28d9"
        >
          {results?.map((result, index) => (
            <>
              <Cell
                fill={
                  result.product.name.includes('Acer Nitro ')
                    ? '#d97706'
                    : '#6d28d9'
                }
                key={`cell-${index}`}
              />
              {/* <LabelList
                dataKey="result"
                position="insideRight"
                content={RenderCustomBarLabel}
              /> */}
            </>
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const RenderCustomBarLabel = ({ x, y, width, height, value }: LabelProps) => {
  return (
    <text
      x={Number(x) + Number(width) - 20}
      y={Number(y) + Number(height) / 2 + 5}
      className="fill-primary-foreground text-sm font-semibold sm:text-base"
      textAnchor="middle"
    >
      {value}
    </text>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}
const RenderCustomTooltip = ({
  active,
  payload,
  label,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Card className="bg-card/95">
        <CardHeader className="w-32 sm:w-64">
          <p className="text-sm font-medium">{label}</p>
        </CardHeader>
        <CardContent className="text-primary">
          <strong>Resultado: {payload[0].value}</strong>
        </CardContent>
      </Card>
    )
  }
  return null
}
