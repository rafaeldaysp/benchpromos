'use client'

import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { priceFormatter } from '@/utils/formatter'
// const chartData = [
//   { month: 'January', desktop: 186, mobile: 80 },
//   { month: 'February', desktop: 305, mobile: 200 },
//   { month: 'March', desktop: 237, mobile: 120 },
//   { month: 'April', desktop: 73, mobile: 190 },
//   { month: 'May', desktop: 209, mobile: 130 },
//   { month: 'June', desktop: 214, mobile: 140 },
// ]

const chartConfig = {
  minPrice: {
    label: 'Preço mínimo',
    color: 'hsl(var(--chart-1))',
  },
  maxPrice: {
    label: 'Preço máximo',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

interface RecommendedProductsChartProps {
  chartData: {
    product: {
      name: string
    }
    category: { name: string }
    minPrice: number
    maxPrice: number
  }[]
}

export function RecommendedProductsChart({
  chartData,
}: RecommendedProductsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartData[0].category.name}</CardTitle>
        <CardDescription>Recomendações do canal</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 180,
            }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              orientation="top"
              type="number"
              dataKey="maxPrice"
              axisLine={false}
              tickMargin={10}
              tickCount={8}
              tickLine={false}
            />
            <YAxis
              dataKey="product.name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 10)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[220px]"
                  formatter={(value, name) => (
                    <>
                      {chartConfig[name as keyof typeof chartConfig]?.label ||
                        name}
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {priceFormatter.format(value as number)}
                      </div>
                      {/* Add this after the last item */}
                    </>
                  )}
                />
              }
            />
            <Bar dataKey="minPrice" fillOpacity="0" radius={5} stackId="a" />
            <Bar
              dataKey="maxPrice"
              fill="var(--color-maxPrice)"
              radius={5}
              stackId="a"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
