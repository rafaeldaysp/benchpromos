import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'

import { BenchmarkChart } from '@/components/benchmarks/benchmark-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notebooksCustomFilters } from '@/constants'
import { type Benchmark } from '@/types'

const GET_BENCHMARK_RESULTS = gql`
  query GetBenchmarks(
    $benchmarkSlug: ID
    $productsSlugs: [String]
    $filters: [FilterInput!]
  ) {
    benchmarkResults(
      benchmarkSlug: $benchmarkSlug
      productsSlugs: $productsSlugs
      filters: $filters
    ) {
      id
      result
      description
      productAlias
      unit
      products {
        name
        slug
      }
      benchmark {
        slug
        name
        lowerIsBetter
      }
    }
  }
`

interface BenchmarkPageProps {
  params: {
    slug: string
  }
  searchParams: {
    [key: string]: string | undefined
  }
}

export default async function BenchmarkPage({
  params: { slug },
  searchParams,
}: BenchmarkPageProps) {
  const { products: productsString, ...filters } = searchParams

  const filtersInput = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => {
      return {
        slug: key,
        options: value!.split('.'),
      }
    })

  const productsArray = productsString?.split('.')

  const { data } = await getClient().query<{
    benchmarkResults: {
      id: string
      result: number
      productAlias: string
      unit: string
      description?: string
      products: {
        name: string
        slug: string
      }[]
      benchmark: Pick<Benchmark, 'name' | 'slug' | 'lowerIsBetter'>
    }[]
  }>({
    query: GET_BENCHMARK_RESULTS,
    variables: {
      productsSlugs: productsArray,
      benchmarkSlug: slug,
      filters: filtersInput,
    },
    errorPolicy: 'ignore',
  })

  const customFiltersApplied = notebooksCustomFilters.filter(
    (customFilter) => filters[customFilter.slug],
  )

  const results = (data?.benchmarkResults ?? []).filter(
    (result) =>
      !customFiltersApplied.length ||
      !customFiltersApplied.some(
        (customFilter) => result.description?.includes(customFilter.value),
      ),
  )

  const benchmarkName =
    results.find((result) => result.benchmark.slug === slug)?.benchmark.name ??
    'Sem resultados'

  return (
    <Card className="lg:col-span-4 lg:h-fit">
      <CardHeader className="px-3 text-center sm:px-8">
        <CardTitle className="text-sm sm:text-base">{benchmarkName}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pl-0 pt-0 sm:px-8 sm:pb-6">
        <BenchmarkChart results={results} />
      </CardContent>
    </Card>
  )
}
