'use client'

import { gql, useQuery } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useTheme } from 'next-themes'
import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '@/lib/utils'
import { priceFormatter } from '@/utils/formatter'
import { Icons } from './icons'
import { PriceBar } from './product-history-price-bar'
import { buttonVariants } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
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
    label: '30 dias',
    value: 30,
  },
  {
    label: '60 dias',
    value: 60,
  },
  {
    label: '3 meses',
    value: 90,
  },
  {
    label: '1 ano',
    value: 365,
  },
]

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
}

export default function PriceChart({
  productSlug,
  currentPrice,
}: PriceChartProps) {
  const [periodInDays, setPeriodInDays] = React.useState(30)
  const [showInstallmentPrice, setShowInstallmentPrice] = React.useState(false)

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
  const minPeriodPriceDay = data?.productHistory?.minPeriodPriceDay
  const minPeriodInstallmentPriceDay =
    data?.productHistory?.minPeriodInstallmentPriceDay
  const dailyHistory = data?.productHistory?.dailyHistory ?? []

  const { theme, systemTheme } = useTheme()

  const accentColor =
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
      ? '#a3a3a3'
      : '#737373'

  return (
    <main className="space-y-4">
      {currentPrice && (
        <PriceBar
          data={dailyHistory
            .filter((dayHistory) =>
              showInstallmentPrice
                ? dayHistory.lowestInstallmentPrice > 0
                : dayHistory.lowestPrice,
            )
            .map((dayHistory) =>
              showInstallmentPrice
                ? dayHistory.lowestInstallmentPrice
                : dayHistory.lowestPrice,
            )}
          currentValue={currentPrice}
          dataRange={periodInDays}
        />
      )}
      <section className="grid grid-cols-1 justify-between gap-2 font-medium sm:grid-cols-3">
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
          <SelectTrigger className="">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {fromNowOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={showInstallmentPrice ? 'true' : 'false'}
          onValueChange={(value) => {
            setShowInstallmentPrice(value == 'true')
          }}
        >
          <SelectTrigger className="">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="false">À vista</SelectItem>
            <SelectItem value="true">Parcelado</SelectItem>
          </SelectContent>
        </Select>
        {minPeriodPriceDay && minPeriodInstallmentPriceDay && (
          <Popover>
            <PopoverTrigger
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'flex gap-x-2 px-2 py-1',
              )}
            >
              <span className="flex items-center gap-x-1">
                <h3 className="hidden text-center text-sm text-muted-foreground md:block">
                  Menor:
                </h3>
                <span className="text-center">
                  {priceFormatter.format(
                    (showInstallmentPrice
                      ? minPeriodInstallmentPriceDay.lowestInstallmentPrice
                      : minPeriodPriceDay.lowestPrice) / 100,
                  )}
                </span>
              </span>
              <Icons.ChevronDown className="h-4 w-4 text-foreground" />
            </PopoverTrigger>
            <PopoverContent className="flex w-fit flex-col items-center justify-center">
              <h3 className="font-semibold">
                {dayjs(
                  showInstallmentPrice
                    ? minPeriodInstallmentPriceDay?.date
                    : minPeriodPriceDay.date,
                ).format('DD[ de] MMMM YYYY')}
              </h3>
              <span className="font-medium text-muted-foreground">
                {priceFormatter.format(
                  (showInstallmentPrice
                    ? minPeriodInstallmentPriceDay?.lowestInstallmentPrice
                    : minPeriodPriceDay?.lowestPrice) / 100,
                )}
              </span>
              <h3 className="flex items-center pt-2 text-sm text-success sm:hidden">
                <Icons.Check className="mr-1 h-4 w-4 text-success" />
                Menor preço
              </h3>
            </PopoverContent>
          </Popover>
        )}
      </section>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          width={500}
          height={200}
          data={dailyHistory}
          margin={{
            top: 10,
            right: 5,
            left: 40,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d28d9" stopOpacity={0.4} />
              <stop offset="75%" stopColor="#6d28d9" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={accentColor}
            strokeDasharray="6 4"
            strokeWidth={0.5}
            opacity={0.5}
            vertical={false}
          />
          <XAxis
            tickFormatter={(value) => dayjs(value).format('DD MMM')}
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            minTickGap={14}
            fontSize={14}
            axisLine={false}
            stroke={accentColor}
          />
          <YAxis
            dataKey={
              showInstallmentPrice ? 'lowestInstallmentPrice' : 'lowestPrice'
            }
            axisLine={false}
            tickMargin={6}
            tickLine={false}
            fontSize={14}
            tickFormatter={(value: number) =>
              priceFormatter.format(value / 100)
            }
            stroke={accentColor}
          />
          <ChartTooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: accentColor,
              strokeDasharray: '6 4',
              strokeWidth: 0.5,
              opacity: 0.5,
            }}
          />
          <Area
            connectNulls
            type="monotone"
            dataKey={
              showInstallmentPrice ? 'lowestInstallmentPrice' : 'lowestPrice'
            }
            stroke="#8884d8"
            strokeWidth={4}
            fill="url(#color)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </main>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 text-center shadow">
        <h4 className="text-lg font-bold">
          {priceFormatter.format(payload[0].value / 100)}
        </h4>
        <p className="text-sm font-medium text-muted-foreground">
          {dayjs(label).format('D MMM YYYY').toUpperCase()}
        </p>
      </div>
    )
  }
  return null
}
