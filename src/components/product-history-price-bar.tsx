'use client'

import * as React from 'react'

import { Icons } from './icons'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Label } from './ui/label'
import { cn } from '@/lib/utils'

const gradativeScale = [
  {
    message: 'muito abaixo da média',
    minValue: -1,
    textStyle: 'text-success',
  },
  {
    minValue: 10,
    message: 'abaixo da média',
    textStyle: 'text-lime-600 dark:text-lime-400',
  },
  {
    minValue: 25,
    message: 'dentro da média',
    textStyle: 'text-auxiliary',
  },
  {
    minValue: 50,
    message: 'dentro da média',
    textStyle: 'text-auxiliary',
  },
  {
    minValue: 75,
    message: 'acima da média',
    textStyle: 'text-orange-500',
  },
  {
    minValue: 90,
    message: 'muito acima da média',
    textStyle: 'text-destructive',
  },
]

export function PriceBar({
  data,
  installmentData,
  currentValue,
  currentValueInstallment,
  dataRange,
}: {
  data: number[]
  installmentData: number[]
  currentValue: number
  currentValueInstallment: number | null
  dataRange: number
}) {
  function limitRange(value: number) {
    if (value > 97) return 97
    if (value < 1) return 1

    return value
  }
  const {
    mean,
    standartDeviation,
    meanInstallment,
    standartDeviationInstallment,
  } = React.useMemo(() => {
    const n = data.length > 0 ? data.length : 1
    const mean = Math.round(data.reduce((a, b) => a + b, 0) / n)
    const standartDeviation = Math.round(
      Math.sqrt(
        data.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 1) / n,
      ),
    )

    const nInstallment = installmentData.length > 0 ? installmentData.length : 1
    const meanInstallment = Math.round(
      installmentData.reduce((a, b) => a + b, 0) / nInstallment,
    )
    const standartDeviationInstallment = Math.round(
      Math.sqrt(
        installmentData
          .map((x) => Math.pow(x - meanInstallment, 2))
          .reduce((a, b) => a + b, 1) / nInstallment,
      ),
    )

    return {
      mean,
      standartDeviation,
      meanInstallment,
      standartDeviationInstallment,
    }
  }, [data, installmentData])

  const priceOnScale =
    (100 * (currentValue - mean)) / (2 * standartDeviation + 1) / 2 + 50

  const installmentPriceOnScale =
    currentValueInstallment && currentValueInstallment > 0
      ? (100 * (currentValueInstallment - meanInstallment)) /
          (2 * standartDeviationInstallment + 1) /
          2 +
        50
      : null

  const maxValueObject = gradativeScale.reduce(
    (prev, current) =>
      current.minValue <= priceOnScale && current.minValue > prev.minValue
        ? current
        : prev,
    gradativeScale[0],
  )
  const maxValueInstallmentObject = installmentPriceOnScale
    ? gradativeScale.reduce(
        (prev, current) =>
          current.minValue <= installmentPriceOnScale &&
          current.minValue > prev.minValue
            ? current
            : prev,
        gradativeScale[0],
      )
    : null

  return (
    <div className="flex gap-2">
      <Card className="w-full">
        <CardHeader className="text-sm">
          <div className="flex items-start space-x-2">
            <Icons.LineChart className="size-4 text-auxiliary" />
            <Label className="flex flex-1 flex-col space-y-2">
              <CardTitle>
                O preço <span className="">à vista </span>
                está{' '}
                <span
                  className={cn('font-semibold', maxValueObject.textStyle, {
                    hidden: mean === 0,
                  })}
                >
                  {maxValueObject.message}
                </span>
                {maxValueInstallmentObject && currentValueInstallment && (
                  <span>
                    {' '}
                    e o preço
                    <span className="font-semibold text-foreground">
                      {' '}
                      parcelado{' '}
                    </span>
                    está{' '}
                    <span
                      className={cn(
                        'font-semibold',
                        maxValueInstallmentObject.textStyle,
                        {
                          hidden: mean === 0,
                        },
                      )}
                    >
                      {maxValueInstallmentObject.message}
                    </span>
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Com base no preço dos últimos{' '}
                <span className="font-semibold text-foreground">
                  {dataRange} dias
                </span>
                , o preço
                <span className="font-semibold text-foreground">
                  {' '}
                  à vista{' '}
                </span>{' '}
                está{' '}
                <span
                  className={cn(maxValueObject.textStyle, {
                    hidden: mean === 0,
                  })}
                >
                  {Math.round(Math.abs(1 - currentValue / mean) * 100)}%{' '}
                  {maxValueObject.minValue >= 50 ? 'acima' : 'abaixo'} da média
                </span>
                {maxValueInstallmentObject && currentValueInstallment && (
                  <span>
                    {' '}
                    e o preço{' '}
                    <span className="font-semibold text-foreground">
                      parcelado{' '}
                    </span>
                    está{' '}
                    <span
                      className={cn(maxValueInstallmentObject.textStyle, {
                        hidden: mean === 0,
                      })}
                    >
                      {Math.round(
                        Math.abs(
                          1 - currentValueInstallment / meanInstallment,
                        ) * 100,
                      )}
                      %{' '}
                      {maxValueInstallmentObject.minValue >= 50
                        ? 'acima da média'
                        : 'abaixo da média'}
                    </span>
                  </span>
                )}
                .
              </CardDescription>
            </Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="px-2 py-4">
            <div className="relative flex h-1.5 w-full items-center rounded-full bg-gradient-to-r from-success via-auxiliary to-destructive">
              <div
                style={{
                  left: limitRange(priceOnScale).toString() + '%',
                }}
                className={cn(
                  'absolute flex flex-col items-center justify-center',
                  { hidden: mean === 0 },
                )}
              >
                {/* Texto "à vista" */}
                <span className="absolute -top-8 whitespace-nowrap text-xs font-semibold">
                  À vista
                </span>
                {/* Ícone Play */}
                <div className="flex size-[18px] items-center justify-center rounded-full bg-background text-primary">
                  <div className="relative size-3 rounded-full border-2 border-foreground bg-background">
                    <Icons.Play className="absolute -top-2.5 left-1/2 size-3 -translate-x-1/2 -translate-y-3/4 rotate-90 fill-primary text-primary" />
                  </div>
                </div>
              </div>
              {installmentPriceOnScale && (
                <div
                  style={{
                    left: limitRange(installmentPriceOnScale).toString() + '%',
                  }}
                  className={cn(
                    'absolute flex flex-col items-center justify-center',
                    { hidden: mean === 0 },
                  )}
                >
                  {/* Texto "parcelado" */}
                  <span className="absolute top-8 text-xs font-semibold">
                    Parcelado
                  </span>
                  {/* Ícone Play */}
                  <div className="flex size-[18px] items-center justify-center rounded-full bg-background">
                    <div className="relative size-3 rounded-full border-2 border-foreground bg-background">
                      <Icons.Play className="absolute left-1/2 top-1.5 size-3 -translate-x-1/2 translate-y-3/4 -rotate-90 fill-auxiliary text-auxiliary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
