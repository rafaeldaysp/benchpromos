'use client'

import { useTheme } from 'next-themes'
import { useSearchParams } from 'next/navigation'
import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  // type LabelProps,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
// import { Card, CardContent, CardHeader } from '../ui/card'

interface BenchmarkChartProps {
  results: {
    result: number
    description?: string
    product: {
      name: string
      slug: string
    }
  }[]
}

export function BenchmarkChart({ results }: BenchmarkChartProps) {
  const isSm = useMediaQuery('(max-width: 640px)')
  const { theme, systemTheme } = useTheme()
  const searchParams = useSearchParams()
  const targetProductSlug = searchParams.get('product')
  const [selected, setSelected] = React.useState(
    targetProductSlug ? [targetProductSlug] : [],
  )

  const accentColor =
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
      ? '#a3a3a3'
      : '#737373'

  const createYAxisString = (result: (typeof results)[number]) => {
    const MAX_STRING_LENGTH = isSm ? 65 : 100
    const descriptionString = result.description
      ? ` [${result.description}]`
      : ''
    if (result.product.name.length <= MAX_STRING_LENGTH)
      return `${result.product.name}`.concat(descriptionString)

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
          left: isSm ? -55 : -40,
        }}
        data={results}
        barSize={isSm ? 25 : 30}
        layout="vertical"
      >
        <defs>
          <linearGradient id="primaryColor" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#6d28d9" stopOpacity={1} />
            <stop offset="75%" stopColor="#6d28d9" stopOpacity={1} />
          </linearGradient>
          <linearGradient id="auxiliaryColor" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#d97706" stopOpacity={1} />
            <stop offset="75%" stopColor="#d97706" stopOpacity={1} />
          </linearGradient>
        </defs>

        <XAxis
          allowDataOverflow
          dataKey="result"
          interval="preserveEnd"
          tickLine={false}
          tickCount={5}
          type="number"
          axisLine={false}
          stroke={accentColor}
          className="text-[10px] font-medium sm:text-sm"
        />
        <YAxis
          dataKey={createYAxisString}
          tickLine={false}
          width={isSm ? 200 : 350}
          type="category"
          stroke={accentColor}
          axisLine={false}
          className="text-[10px] font-medium sm:text-sm"
        />

        {/* <Tooltip
          cursor={false}
          content={<RenderCustomTooltip targetProduct={targetProductName} />}
        /> */}
        <CartesianGrid
          stroke={accentColor}
          strokeDasharray="3 3"
          horizontal={false}
        />
        <Bar
          dataKey="result"
          className="cursor-pointer"
          // label={RenderCustomBarLabel}
          name="Resultado"
          radius={[0, 4, 4, 0]}
          onClick={(data) => {
            const productSlug = data.product.slug as string
            selected?.includes(productSlug)
              ? setSelected((prev) =>
                  prev.filter((slug) => slug !== productSlug),
                )
              : setSelected((prev) => [...prev, productSlug])
          }}
        >
          <LabelList dataKey="result" position="insideRight" stroke="#f9fafb" />
          {results?.map((result, index) => {
            return (
              <Cell
                className={cn(
                  'fill-primary transition-colors hover:fill-primary/80',
                  {
                    'fill-amber-500 hover:fill-amber-500/80': selected.includes(
                      result.product.slug,
                    ),
                  },
                )}
                key={`cell-${index}`}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// const RenderCustomBarLabel = ({ x, y, width, height, value }: LabelProps) => {
//   return (
//     <text
//       x={Number(x) + Number(width) - 20}
//       y={Number(y) + Number(height) / 2 + 5}
//       className="select-none fill-primary-foreground text-xs font-bold sm:text-base"
//       textAnchor="middle"
//     >
//       {value}
//     </text>
//   )
// }

// interface CustomTooltipProps {
//   active?: boolean
//   payload?: { value: number }[]
//   label?: string
//   targetProduct?: string
// }
// const RenderCustomTooltip = ({
//   active,
//   payload,
//   label,
//   targetProduct,
// }: CustomTooltipProps) => {
//   if (active && payload && payload.length) {
//     return (
//       <Card className="bg-card/95">
//         <CardHeader className="w-40 p-4 sm:w-64 sm:p-6">
//           <p className="text-xs font-medium sm:text-sm">{label}</p>
//         </CardHeader>
//         <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
//           <p
//             className={cn('text-sm font-bold text-primary sm:text-base', {
//               'text-[#d97706]': targetProduct && label?.includes(targetProduct),
//             })}
//           >
//             Resultado: {payload[0].value}
//           </p>
//         </CardContent>
//       </Card>
//     )
//   }
//   return null
// }
