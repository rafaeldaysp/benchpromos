'use client'

import { gql, useQuery } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { priceFormatter } from '@/utils/formatter'
import { PriceBar } from './product-history-price-bar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
  type ChartConfig,
} from './ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

dayjs.locale('pt-br')

const fromNowOptions = [
  {
    label: '30 days',
    value: 30,
  },
  {
    label: '60 days',
    value: 60,
  },
  {
    label: '3 months',
    value: 90,
  },
  {
    label: '1 year',
    value: 365,
  },
]

const chartConfig = {
  visitors: {
    label: 'Price',
  },
  lowestPrice: {
    label: 'In cash',
    color: 'hsl(var(--chart-1))',
  },
  lowestInstallmentPrice: {
    label: 'Installment',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig

const GET_PRODUCT_HISTORY = gql`
  query ($input: GetProductHistoryInput!) {
    productHistory(productHistoryInput: $input) {
      dailyHistory {
        lowestPrice
        lowestInstallmentPrice
        date
      }
      minPeriodPriceDay {
        date
        lowestPrice
      }
      minPeriodInstallmentPriceDay {
        date
        lowestInstallmentPrice
      }
    }
  }
`
type DailyHistory = {
  lowestPrice: number
  lowestInstallmentPrice: number
  date: string
}
interface PriceChartProps {
  productSlug: string
  currentPrice: number | null
  currentInstallmentPrice: number | null
}

export default function PriceChart({
  productSlug,
  currentPrice,
  currentInstallmentPrice,
}: PriceChartProps) {
  const [periodInDays, setPeriodInDays] = React.useState(30)

  const { data, refetch } = useQuery<{
    productHistory: {
      dailyHistory: DailyHistory[]
      minPeriodPriceDay?: DailyHistory
      minPeriodInstallmentPriceDay?: DailyHistory
    }
  }>(GET_PRODUCT_HISTORY, {
    variables: {
      input: {
        periodInDays,
        productId: productSlug,
      },
    },
    fetchPolicy: 'cache-and-network',
    refetchWritePolicy: 'overwrite',
    errorPolicy: 'ignore',
  })

  const dailyHistory = data?.productHistory?.dailyHistory ?? []

  const formattedData = dailyHistory.map((dayHistory) => ({
    ...dayHistory,
    lowestPrice: dayHistory.lowestPrice,
    lowestInstallmentPrice: [
      dayHistory.lowestPrice ?? 0,
      dayHistory.lowestInstallmentPrice,
    ],
  }))

  return (
    <main className="space-y-4">
      {currentPrice && (
        <PriceBar
          data={dailyHistory
            .filter((dayHistory) => dayHistory.lowestPrice)
            .map((dayHistory) => dayHistory.lowestPrice)}
          currentValue={currentPrice}
          installmentData={dailyHistory
            .filter((dayHistory) => dayHistory.lowestInstallmentPrice)
            .map((dayHistory) => dayHistory.lowestInstallmentPrice)}
          currentValueInstallment={currentInstallmentPrice}
          dataRange={periodInDays}
        />
      )}

      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Price Evolution Chart</CardTitle>
            <CardDescription>
              Follow the variations of the price in cash and installment in the
              last <strong>{periodInDays}</strong> days
            </CardDescription>
          </div>

          <Select
            value={periodInDays.toString()}
            onValueChange={(value) => {
              setPeriodInDays(Number(value))
              refetch({
                input: {
                  periodInDays: Number(value),
                  productId: productSlug,
                },
              })
            }}
          >
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {fromNowOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value.toString()}
                  className="rounded-lg"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart data={formattedData} margin={{ left: 30, top: 10 }}>
              <defs>
                <linearGradient
                  id="fillLowestPrice"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-lowestPrice)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-lowestPrice)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient
                  id="fillLowestInstallmentPrice"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-lowestInstallmentPrice)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-lowestInstallmentPrice)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => dayjs(value).format('DD MMM')}
              />

              <YAxis
                tickCount={5}
                tickMargin={8}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => priceFormatter.format(value / 100)}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      dayjs(value).format('DD[ de] MMMM YYYY')
                    }
                    formatter={(value, name, _item, _index) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                          style={
                            {
                              '--color-bg': `var(--color-${name})`,
                            } as React.CSSProperties
                          }
                        />
                        <span className="font-normal text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]
                            ?.label || name}
                        </span>

                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                          {priceFormatter.format(
                            Array.isArray(value)
                              ? Number(value[value.length - 1]) / 100
                              : Number(value) / 100,
                          )}
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="lowestPrice"
                type="monotone"
                fill="url(#fillLowestPrice)"
                stroke="var(--color-lowestPrice)"
                connectNulls
                // stackId="a"
              />
              <Area
                dataKey="lowestInstallmentPrice"
                type="monotone"
                fill="url(#fillLowestInstallmentPrice)"
                stroke="var(--color-lowestInstallmentPrice)"
                connectNulls
                // stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </main>
  )
}
