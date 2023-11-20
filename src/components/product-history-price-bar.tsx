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
  currentValue,
  dataRange,
}: {
  data: number[]
  currentValue: number
  dataRange: number
}) {
  function limitRange(value: number) {
    if (value > 97) return 97
    if (value < 1) return 1

    return value
  }
  const { mean, standartDeviation } = React.useMemo(() => {
    const n = data.length > 0 ? data.length : 1
    const mean = Math.round(data.reduce((a, b) => a + b, 0) / n)
    const standartDeviation = Math.round(
      Math.sqrt(
        data.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 1) / n,
      ),
    )

    return { mean, standartDeviation }
  }, [data])

  const priceOnScale =
    (100 * (currentValue - mean)) / (2 * standartDeviation + 1) / 2 + 50

  const maxValueObject = gradativeScale.reduce(
    (prev, current) =>
      current.minValue <= priceOnScale && current.minValue > prev.minValue
        ? current
        : prev,
    gradativeScale[0],
  )

  return (
    <div className="flex gap-2">
      <Card className="w-full">
        <CardHeader className="text-sm">
          <div className="flex items-start space-x-2">
            <Icons.LineChart className="h-4 w-4 text-auxiliary" />
            <Label className="flex flex-1 flex-col space-y-1">
              <CardTitle>
                O preço está{' '}
                <span
                  className={cn(maxValueObject.textStyle, {
                    hidden: mean === 0,
                  })}
                >
                  {maxValueObject.message}
                </span>
              </CardTitle>
              <CardDescription>
                Com base no preço dos últimos{' '}
                <span className="font-semibold text-foreground">
                  {dataRange} dias
                </span>
                , o produto está com o preço{' '}
                <span
                  className={cn('font-semibold', maxValueObject.textStyle, {
                    hidden: mean === 0,
                  })}
                >
                  {maxValueObject.message}
                </span>
                .
              </CardDescription>
            </Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative flex h-1.5 w-full items-center rounded-full bg-gradient-to-r from-success via-auxiliary to-destructive">
            <div
              style={{
                left: limitRange(priceOnScale).toString() + '%',
              }}
              className={cn(
                'absolute flex h-[18px] w-[18px] items-center justify-center rounded-full bg-background',
                { hidden: mean === 0 },
              )}
            >
              <div className="relative h-3 w-3 rounded-full border-2 border-foreground bg-background">
                <Icons.Play className="absolute -top-3/4 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-3/4 rotate-90 fill-foreground text-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
