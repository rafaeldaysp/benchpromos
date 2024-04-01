'use client'

import { useTheme } from 'next-themes'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
import { useQueryString } from '@/hooks/use-query-string'

interface BenchmarkChartProps {
  results: {
    id: string
    result: number
    description?: string
    unit?: string
    productAlias: string
    products: {
      slug: string
    }[]
  }[]
}

function reorganizeResults({ results }: BenchmarkChartProps) {
  if (results.length < 3) return results
  // @ts-expect-error ...
  const newResults = []
  const exludingIds: string[] = []

  function similarity(s1: string, s2: string) {
    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1
    const longerLength = longer.length
    if (longerLength === 0) {
      return 1.0
    }
    return (longerLength - editDistance(longer, shorter)) / longerLength
  }

  function editDistance(s1: string, s2: string) {
    s1 = s1.toLowerCase()
    s2 = s2.toLowerCase()

    const costs = []
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j
        } else if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue
      }
    }
    return costs[s2.length]
  }

  results.forEach((result) => {
    if (result.description?.includes('Frame Generation')) {
      const resultWithoutFG = results
        .filter(
          (findedResult) =>
            findedResult.productAlias === result.productAlias &&
            !findedResult.description?.includes('Frame Generation'),
        )
        .sort(
          (a, b) =>
            similarity(b.description ?? '', result.description ?? '') -
            similarity(a.description ?? '', result.description ?? ''),
        )

      newResults.push({
        ...result,
        resultNoFG: resultWithoutFG[0].result,
      })
      exludingIds.push(resultWithoutFG[0].id)
    } else if (!exludingIds.includes(result.id)) newResults.push(result)
  })
  // @ts-expect-error ...
  return newResults
}

export function BenchmarkChart({ results }: BenchmarkChartProps) {
  const isSm = useMediaQuery('(max-width: 640px)')
  const { theme, systemTheme } = useTheme()
  const productFromProductPage = useSearchParams().get('product')

  const initialProductSelected = React.useMemo(() => {
    if (!productFromProductPage) return undefined

    return results.find((result) =>
      result.products.some(
        (product) => product.slug === productFromProductPage,
      ),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFromProductPage])

  const formatedResults = React.useMemo(() => {
    return reorganizeResults({ results })
  }, [results])

  const [selected, setSelected] = React.useState<
    { alias: string; result: number }[]
  >(
    initialProductSelected
      ? [
          {
            alias: initialProductSelected.productAlias,
            result: initialProductSelected.result,
          },
        ]
      : [],
  )

  const { createQueryString } = useQueryString()
  const router = useRouter()
  const pathname = usePathname()

  const maxResult = Math.max(...formatedResults.map((obj) => obj.result))

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

  if (formatedResults.length === 0)
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
          formatedResults.length < 3 ? 'w-3/5' : 'w-full'
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

      <ResponsiveContainer
        height={
          (isSm ? 40 : 50) +
          (isSm ? 40 : 50) * (formatedResults ? formatedResults.length : 0)
        }
        width={'100%'}
        className={'relative select-none sm:select-auto'}
      >
        <BarChart
          data={formatedResults}
          barSize={isSm ? 25 : 30}
          layout="vertical"
          barGap={isSm ? -25 : -30}
          margin={{ top: 0 }}
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

          <CartesianGrid
            stroke={accentColor}
            strokeDasharray="3 3"
            horizontal={false}
          />
          <Legend
            verticalAlign="top"
            content={
              <CustomLegend
                unit={results[0].unit ?? 'oi'}
                hasFG={results.length !== formatedResults.length}
              />
            }
          />

          <Bar
            // xAxisId={0}
            dataKey="result"
            fillOpacity={0.7}
            className="cursor-pointer"
            name="Resultado"
            radius={[0, 4, 4, 0]}
            onClick={(data) => {
              const productAlias = data.productAlias as string
              if (productAlias === initialProductSelected?.productAlias)
                router.push(
                  `${pathname}?${createQueryString({
                    product: null,
                  })}`,
                )
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
            <LabelList
              content={
                <RenderCustomBarLabel
                  selected={selected}
                  isSm={isSm}
                  maxValue={maxResult}
                />
              }
            />

            {formatedResults?.map((result, index) => {
              return (
                <Cell
                  className={cn(
                    'fill-primary transition-colors hover:fill-primary/80',
                    {
                      'fill-auxiliary/80 hover:fill-auxiliary/60':
                        selected.some(
                          (item) => item.alias === result.productAlias,
                        ),
                    },
                  )}
                  key={`cell-${index}`}
                />
              )
            })}
          </Bar>

          {!isSm && (
            <Bar
              // xAxisId={1}
              dataKey="resultNoFG"
              className="cursor-pointer"
              name="Resultado"
              radius={[0, 4, 4, 0]}
              onClick={(data) => {
                const productAlias = data.productAlias as string
                if (productAlias === initialProductSelected?.productAlias)
                  router.push(
                    `${pathname}?${createQueryString({
                      product: null,
                    })}`,
                  )
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
              {!isSm && (
                <LabelList
                  className="bg-white stroke-foreground text-[10px] text-foreground sm:text-sm"
                  position={'insideRight'}
                />
              )}

              {formatedResults?.map((result, index) => {
                return (
                  <Cell
                    className={cn(
                      'border fill-primary transition-colors hover:fill-primary/80',
                      {
                        'fill-auxiliary/40 hover:fill-auxiliary/20':
                          selected.some(
                            (item) => item.alias === result.productAlias,
                          ),
                      },
                    )}
                    key={`cell-${index}`}
                  />
                )
              })}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomLegend({ unit, hasFG }: { unit: string; hasFG?: boolean }) {
  return (
    <div className="flex w-full items-center justify-center gap-6">
      <div className="mb-2 flex items-center justify-center gap-x-2">
        <div className="h-4 w-4 rounded-sm bg-primary" />
        <span className="text-xs text-muted-foreground sm:text-base">
          {unit}
        </span>
      </div>
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
  const textPositionThreshold = (maxValue * 3) / 4
  return (
    <>
      <text
        x={
          Number(x) +
          Number(width) +
          (textPositionThreshold > Number(value) ? 4 : -4)
        }
        y={Number(y) + Number(height) / 2 + 4}
        className={cn(
          'select-none fill-foreground text-[10px] font-bold sm:text-sm',
          {
            'fill-primary-foreground': textPositionThreshold <= Number(value),
          },
        )}
        textAnchor={textPositionThreshold > Number(value) ? 'right' : 'end'}
      >
        {value}
      </text>
      {selected.length > 0 && (
        <text
          x={
            Number(x) +
            Number(width) +
            4 +
            (textPositionThreshold > Number(value)
              ? Math.log10(Number(value)) * 10 + 5
              : 0) +
            (isSm && textPositionThreshold > Number(value) ? -5 : 0)
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
