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
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  type LabelProps,
} from 'recharts'

import Logo from '@/assets/full-logo-bench-promos.svg'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface BenchmarkChartProps {
  results: {
    result: number
    description?: string
    unit?: string
    productAlias: string
  }[]
}

export function BenchmarkChart({ results }: BenchmarkChartProps) {
  const isSm = useMediaQuery('(max-width: 640px)')
  const { theme, systemTheme } = useTheme()
  const [selected, setSelected] = React.useState<
    { alias: string; result: number }[]
  >([])

  const maxResult = Math.max(...results.map((obj) => obj.result))

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
            domain={[
              0,
              (dataMax: number) =>
                Math.ceil((dataMax / (isSm ? 3 : 4) + dataMax) / 5) * 5,
            ]}
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
            content={
              <RenderCustomTooltip selectedResult={selected[0]?.result} />
            }
          /> */}
          <CartesianGrid
            stroke={accentColor}
            strokeDasharray="3 3"
            horizontal={false}
          />
          <Legend content={<CustomLegend unit={results[0].unit ?? 'oi'} />} />
          <Bar
            dataKey="result"
            className="cursor-pointer"
            name="Resultado"
            radius={[0, 4, 4, 0]}
            onClick={(data) => {
              const productAlias = data.productAlias as string
              selected.some((item) => item.alias === productAlias)
                ? setSelected((prev) =>
                    prev.filter((item) => item.alias !== productAlias),
                  )
                : setSelected((prev) => [
                    ...prev,
                    { alias: productAlias, result: data.result },
                  ])
            }}
          >
            {/* <LabelList
              position="right"
              // stroke="#f9fafb"
              className="bg-white stroke-foreground text-[10px] sm:text-sm"
            /> */}

            <LabelList
              content={
                <RenderCustomBarLabel
                  selected={selected}
                  isSm={isSm}
                  maxValue={maxResult}
                />
              }
            />

            {results?.map((result, index) => {
              return (
                <Cell
                  className={cn(
                    'fill-primary transition-colors hover:fill-primary/80',
                    {
                      'fill-auxiliary/80 hover:fill-auxiliary/60':
                        selected.some(
                          (item) => item.alias === result.productAlias,
                        ),
                      // 'fill-success hover:fill-success/80': selected.some(
                      //   (item) =>
                      //     item.alias === result.productAlias &&
                      //     item.result > selected[0]?.result,
                      // ),
                      // 'fill-destructive hover:fill-destructive/80':
                      //   selected.some(
                      //     (item) =>
                      //       item.alias === result.productAlias &&
                      //       item.result < selected[0]?.result,
                      //   ),
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

function CustomLegend({ unit }: { unit: string }) {
  return (
    <div className="flex w-full items-center justify-center gap-x-2">
      <div className="h-4 w-4 rounded-sm bg-primary" />
      <span className="text-muted-foreground">{unit}</span>
    </div>
  )
}
const RenderCustomBarLabel = ({
  x,
  y,
  width,
  height,
  value,
  selected,
  isSm,
  maxValue,
}: LabelProps & {
  selected: { alias: string; result: number }[]
  isSm: boolean
  maxValue: number
}) => {
  return (
    <>
      <text
        x={Number(x) + Number(width) + (maxValue / 2 > Number(value) ? 4 : -4)}
        y={Number(y) + Number(height) / 2 + 4}
        className="select-none fill-foreground text-[10px] font-bold sm:text-sm"
        textAnchor={maxValue / 2 > Number(value) ? 'right' : 'end'}
      >
        {value}
      </text>
      {selected.length > 0 && (
        <text
          x={
            Number(x) +
            Number(width) +
            4 +
            (maxValue / 2 > Number(value)
              ? Math.log10(Number(value)) * 10 + 5
              : 0) +
            (isSm && maxValue / 2 > Number(value) ? -5 : 0)
          }
          y={Number(y) + Number(height) / 2 + 4}
          className={cn(
            'select-none fill-auxiliary text-[10px] font-bold sm:text-sm',
            {
              'fill-success': Number(value) > selected[0].result,
              'fill-destructive': Number(value) < selected[0].result,
            },
          )}
          textAnchor="right"
        >
          {<>{Math.ceil((100 * Number(value)) / selected[0].result - 100)}%</>}
        </text>
      )}
    </>
  )
}

// interface CustomTooltipProps {
//   active?: boolean
//   payload?: { value: number }[]
//   label?: string
//   targetProduct?: string
//   selectedResult?: number
// }
// const RenderCustomTooltip = ({
//   active,
//   payload,
//   label,
//   targetProduct,
//   selectedResult,
// }: CustomTooltipProps) => {
//   if (active && payload && payload.length) {
//     return (
//       <Card className="bg-card/95">
//         <CardHeader className="w-40 p-4 sm:w-64">
//           <p className="text-xs font-semibold sm:text-sm">{label}</p>
//         </CardHeader>
//         <CardContent className="p-4 pt-0">
//           <p
//             className={cn('text-sm font-bold text-primary sm:text-base', {
//               'text-[#d97706]': targetProduct && label?.includes(targetProduct),
//             })}
//           >
//             Resultado: {payload[0].value}
//           </p>
//           {selectedResult && (
//             <span
//               className={cn('text-sm font-bold text-auxiliary sm:text-base', {
//                 'text-success': selectedResult < payload[0].value,
//                 'text-destructive': selectedResult > payload[0].value,
//               })}
//             >
//               Variação:{' '}
//               {Math.ceil((100 * payload[0].value) / selectedResult - 100)}%
//             </span>
//           )}
//         </CardContent>
//       </Card>
//     )
//   }
//   return null
// }
