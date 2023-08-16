'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { type BenchmarkChartData } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

interface BenchmarkChartProps {
  benchmarks: BenchmarkChartData[]
}

export function BenchmarkChart({ benchmarks }: BenchmarkChartProps) {
  const [selectedBenchark, setSelectedBenchmark] = React.useState<
    BenchmarkChartData | undefined
  >(undefined)

  return (
    <div className="space-y-5">
      <Select
        onValueChange={(value) => {
          setSelectedBenchmark(
            benchmarks.find((benchmark) => benchmark.id === value),
          )
        }}
      >
        <SelectTrigger className="h-8 w-fit">
          <SelectValue placeholder="Selecione um benchmark" />
        </SelectTrigger>
        <SelectContent side="top">
          {benchmarks.map((benchmark) => (
            <SelectItem key={benchmark.id} value={benchmark.id}>
              {benchmark.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedBenchark && (
        <BarChart
          width={500}
          height={400}
          data={selectedBenchark.results}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={40}
          layout="vertical"
        >
          <XAxis scale="linear" tickCount={5} axisLine={false} type="number" />
          <YAxis type="category" width={100} dataKey="product['name']" />
          <Tooltip labelStyle={{ color: 'black' }} />
          <Legend />
          <CartesianGrid strokeDasharray="3 3" color="#ffffff" />
          <Bar
            dataKey="result"
            className="fill-primary"
            radius={2}
            label={renderCustomBarLabel}
          >
            {/* <LabelList dataKey="result" /> */}
          </Bar>
        </BarChart>
      )}
    </div>
  )
}

// @ts-expect-error ...
const renderCustomBarLabel = ({ x, y, width, height, value }) => {
  return (
    <text
      x={x + width - 15}
      y={y + height / 2 + 5}
      className="fill-primary-foreground"
      textAnchor="middle"
    >
      {value}
    </text>
  )
}
