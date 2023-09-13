'use client'

import { useTheme } from 'next-themes'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
} from 'recharts'
import { Card, CardContent, CardHeader } from '../ui/card'

interface BenchmarkChartProps {
  results: {
    result: number
    description?: string
    product: {
      name: string
    }
  }[]
  targetProductName?: string
}

export function BenchmarkChart({
  results,
  targetProductName,
}: BenchmarkChartProps) {
  const isSm = useMediaQuery('(max-width: 640px)')
  const { theme, systemTheme } = useTheme()

  const createYAxisString = (result: (typeof results)[number]) => {
    const MAX_STRING_LENGTH = isSm ? 65 : 100
    const descriptionString = result.description
      ? ` [${result.description}]`
      : ''
    if (result.product.name.length <= MAX_STRING_LENGTH)
      return `${result.product.name}`.concat(descriptionString) // No need to truncate

    return result.product.name
      .substring(0, MAX_STRING_LENGTH - 3)
      .concat('...')
      .concat(descriptionString)
  }

  if (results.length === 0)
    return (
      <div className="flex w-full justify-center text-center">
        <span className="text-sm sm:text-base">
          Poxa, não encontramos nenhum benchmark para o(s) produto(s)
          selecionado(s).
        </span>
      </div>
    )

  return (
    <ResponsiveContainer
      height={
        (isSm ? 40 : 50) + (isSm ? 40 : 50) * (results ? results.length : 0)
      }
      width={'100%'}
      className={'select-none sm:select-auto'}
    >
      <BarChart
        margin={{
          left: -55,
        }}
        data={results}
        barSize={isSm ? 25 : 30}
        layout="vertical"
      >
        <XAxis
          allowDataOverflow
          dataKey="result"
          interval="preserveEnd"
          tickLine={false}
          tickCount={5}
          type="number"
          axisLine={false}
          fontSize={isSm ? 10 : 14}
          fontWeight={500}
          stroke={
            theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
              ? '#fafafa'
              : '#0a0a0a'
          }
        />
        <YAxis
          dataKey={createYAxisString}
          tickLine={false}
          width={isSm ? 200 : 350}
          type="category"
          stroke={
            theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
              ? '#fafafa'
              : '#0a0a0a'
          }
          fontSize={isSm ? 10 : 14}
          fontWeight={500}
          axisLine={false}
        />

        <Tooltip
          cursor={false}
          content={<RenderCustomTooltip targetProduct={targetProductName} />}
        />
        <CartesianGrid
          stroke={
            theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
              ? '#fafafa'
              : '#0a0a0a'
          }
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
            <Cell
              fill={
                targetProductName &&
                result.product.name.includes(targetProductName)
                  ? '#d97706'
                  : '#6d28d9'
              }
              key={`cell-${index}`}
            />
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
      className="fill-primary-foreground text-xs font-bold sm:text-base"
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
  targetProduct?: string
}
const RenderCustomTooltip = ({
  active,
  payload,
  label,
  targetProduct,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Card className="bg-card/95">
        <CardHeader className="w-40 p-4 sm:w-64 sm:p-6">
          <p className="text-xs font-medium sm:text-sm">{label}</p>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <p
            className={cn('text-sm font-bold text-primary sm:text-base', {
              'text-[#d97706]': targetProduct && label?.includes(targetProduct),
            })}
          >
            Resultado: {payload[0].value}
          </p>
        </CardContent>
      </Card>
    )
  }
  return null
}
