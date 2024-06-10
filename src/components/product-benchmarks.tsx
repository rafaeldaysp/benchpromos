'use client'

import { type Benchmark, type BenchmarkResult } from '@/types'
import { gql, useQuery } from '@apollo/client'

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
          video
        }
      }
    }
  }
`

interface ProductBenchmarksProps {
  productSlug: string
}

export function ProductBenchmarks({ productSlug }: ProductBenchmarksProps) {
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

  if (!groupedBenchmarks?.length)
    return (
      <h3 className="text-sm text-muted-foreground">
        Esse produto não apresenta resultados em benchmarks.
      </h3>
    )

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
