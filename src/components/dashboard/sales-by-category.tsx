'use client'

import { Pie, PieChart } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface SalesRankingProps {
  chartData: {
    amount: number
    categoryName: string
    fill: string
  }[]
}

export function SalesByCategory({ chartData }: SalesRankingProps) {
  const dynamicChartConfig = chartData.reduce<ChartConfig>(
    (acc, item) => {
      acc[item.categoryName] = { label: item.categoryName, color: item.fill }
      return acc
    },
    { amount: { label: 'Promoções' } },
  ) satisfies ChartConfig

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Promoções por categoria</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={dynamicChartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData.slice(0, 10)}
              dataKey="amount"
              label
              nameKey="categoryName"
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="categoryName" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
