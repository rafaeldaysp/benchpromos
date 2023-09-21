'use client'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useTheme } from 'next-themes'

import { priceFormatter } from '@/utils/formatter'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from './ui/button'
import { Toggle } from './ui/toggle'

dayjs.locale('pt-br')

const requestDateOptions = [
  {
    label: '30 dias',
    value: 30,
  },
  {
    label: '60 dias',
    value: 60,
  },
  {
    label: '90 dias',
    value: 90,
  },
  {
    label: '1 ano',
    value: 365,
  },
]

interface PriceChartProps {
  data: {
    lowestPrice: number
    date: string
  }[]
}
export default function PriceChart({ data }: PriceChartProps) {
  const { theme, systemTheme } = useTheme()

  const accentColor =
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
      ? '#a3a3a3'
      : '#737373'

  return (
    <main className="space-y-4">
      <nav className="w-fit space-x-1 rounded-lg bg-muted p-1">
        {requestDateOptions.map((option) => (
          <Toggle
            variant={'primary'}
            className="h-fit px-2 py-1 font-medium text-muted-foreground"
            key={option.value}
          >
            {option.label}
          </Toggle>
        ))}
      </nav>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          width={500}
          height={200}
          data={data}
          margin={{
            top: 10,
            right: 0,
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
            tickMargin={6}
            fontSize={14}
            axisLine={false}
            stroke={accentColor}
          />
          <YAxis
            dataKey="lowestPrice"
            axisLine={false}
            tickMargin={6}
            tickLine={false}
            fontSize={14}
            tickFormatter={(value: number) =>
              priceFormatter.format(value / 100)
            }
            stroke={accentColor}
          />
          <Tooltip
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
            dataKey="lowestPrice"
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
      <div className="rounded-lg border bg-background p-2 shadow">
        <h4 className="text-xl font-bold">
          {priceFormatter.format(payload[0].value / 100)}
        </h4>
        <p className="text-muted-foreground">
          {dayjs(label).format('D MMM YYYY')}
        </p>
      </div>
    )
  }
  return null
}
