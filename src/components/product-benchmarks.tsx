'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { type Benchmark, type BenchmarkResult } from '@/types'
import { Icons } from './icons'
import { buttonVariants } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { gql, useQuery } from '@apollo/client'
import { Card, CardContent } from './ui/card'
import { ProductBenchmarkCard } from './product-benchmark-card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/carousel'

const GET_GROUPED_BENCHMARKS = gql`
  query GetGroupedBenchmarks($productSlug: String!) {
    groupedBenchmarksForProduct(productSlug: $productSlug) {
      name
      id
      imageUrl
      children {
        id
        name
        results {
          id
          result
          description
        }
      }
    }
  }
`

interface ProductBenchmarksProps {
  benchmarksResults: (Omit<BenchmarkResult, 'productId' | 'benchmarkId'> & {
    benchmark: Omit<Benchmark, 'id'>
  })[]
  productSlug: string
}

export function ProductBenchmarks({
  benchmarksResults,
  productSlug,
}: ProductBenchmarksProps) {
  const { data } = useQuery<{
    groupedBenchmarksForProduct: (Benchmark & {
      children: (Benchmark & { results: BenchmarkResult[] })[]
    })[]
  }>(GET_GROUPED_BENCHMARKS, {
    variables: {
      productSlug,
    },
  })

  const groupedBenchmarks = data?.groupedBenchmarksForProduct

  if (!groupedBenchmarks) return

  return (
    <Carousel
      opts={{
        align: 'center',
        dragFree: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {groupedBenchmarks.map((benchmark) => (
          <CarouselItem
            key={benchmark.name}
            className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
          >
            <ProductBenchmarkCard benchmark={benchmark} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0" />
      <CarouselNext className="right-0" />
    </Carousel>
  )
}
