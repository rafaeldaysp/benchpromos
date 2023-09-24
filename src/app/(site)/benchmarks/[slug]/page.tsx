import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'

import { BenchmarkChart } from '@/components/benchmarks/benchmark-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const GET_BENCHMARK_RESULTS = gql`
  query GetBenchmarks($benchmarkSlug: ID, $productsSlugs: [String]) {
    benchmarkResults(
      benchmarkSlug: $benchmarkSlug
      productsSlugs: $productsSlugs
    ) {
      result
      description
      product {
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
    products: string
  }
}

export default async function BenchmarkPage({
  params: { slug },
  searchParams,
}: BenchmarkPageProps) {
  const { products: productsString } = searchParams

  const productsArray = productsString?.split('.')

  const { data } = await getClient().query<{
    benchmarkResults: {
      result: number
      description?: string
      product: {
        name: string
        slug: string
      }
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
    },
    errorPolicy: 'ignore',
  })

  const results = data?.benchmarkResults ?? []

  const benchmarkName =
    results.find((result) => result.benchmark.slug === slug)?.benchmark.name ??
    'Sem resultados'

  return (
    <Card className="lg:col-span-4 lg:h-fit">
      <CardHeader>
        <CardTitle>
          <p className="text-center text-sm sm:text-base">{benchmarkName}</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pl-0 pt-0 sm:p-6 sm:px-8 sm:pt-0 lg:px-12">
        <BenchmarkChart results={results} />
      </CardContent>
    </Card>
  )
}
