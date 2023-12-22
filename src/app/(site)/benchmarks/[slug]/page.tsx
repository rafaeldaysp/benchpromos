import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'

import { BenchmarkChart } from '@/components/benchmarks/benchmark-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
      result: number
      productAlias: string
      unit: string
      description?: string
      products: {
        name: string
        slug: string
      }[]
      benchmark: {
        name: string
        slug: string
      }
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

  const results = data?.benchmarkResults ?? []

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
