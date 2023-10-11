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
import Image from 'next/image'
// import { Card, CardContent, CardHeader } from '../ui/card'

import Logo from '@/assets/full-logo-bench-promos.svg'

interface BenchmarkChartProps {
  results: {
    result: number
    description?: string
    productAlias: string
  }[]
}

export function BenchmarkChart({ results }: BenchmarkChartProps) {
  const isSm = useMediaQuery('(max-width: 640px)')
  const { theme, systemTheme } = useTheme()
  const searchParams = useSearchParams()
  const targetProductAlias = searchParams.get('product')
  const [selected, setSelected] = React.useState(
    targetProductAlias ? [targetProductAlias] : [],
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
    if (result.productAlias.length <= MAX_STRING_LENGTH)
      return `${result.productAlias}`.concat(descriptionString)

    return result.productAlias
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
    <div className="relative">
      <div
        className={`absolute left-1/2 top-1/2 aspect-square ${
          results.length < 3 ? 'w-3/5' : 'w-full'
        } -translate-x-1/2 -translate-y-1/2`}
      >
        <Image
          src={Logo}
          alt={'Logo'}
          className="rounded-lg object-contain opacity-5"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      {/* <div className="absolute bottom-2 right-0 aspect-square w-16 -rotate-12 sm:w-20 md:w-24">
        <Image
          src={Logo}
          alt={'Logo'}
          className="rounded-lg object-contain"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div> */}

      <ResponsiveContainer
        height={
          (isSm ? 40 : 50) + (isSm ? 40 : 50) * (results ? results.length : 0)
        }
        width={'100%'}
        className={'relative select-none sm:select-auto'}
      >
        <BarChart data={results} barSize={isSm ? 25 : 30} layout="vertical">
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
              const productAlias = data.productAlias as string
              selected?.includes(productAlias)
                ? setSelected((prev) =>
                    prev.filter((slug) => slug !== productAlias),
                  )
                : setSelected((prev) => [...prev, productAlias])
            }}
          >
            <LabelList
              dataKey="result"
              position="insideRight"
              stroke="#f9fafb"
              className="text-sm sm:text-lg"
            />
            {results?.map((result, index) => {
              return (
                <Cell
                  className={cn(
                    'fill-primary transition-colors hover:fill-primary/80',
                    {
                      'fill-amber-500 hover:fill-amber-500/80':
                        selected.includes(result.productAlias),
                    },
                  )}
                  key={`cell-${index}`}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
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
