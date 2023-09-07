import { gql } from '@apollo/client'

import { BenchmarkChart } from '@/components/benchmarks/benchmark-chart'
import { BenchmarkSelect } from '@/components/benchmarks/benchmark-select'
import { getClient } from '@/lib/apollo'
import { Icons } from '@/components/icons'
import { ProductSelect } from '@/components/benchmarks/product-select'

const GET_BENCHMARKS = gql`
  query GetBenchmarks($hasResults: Boolean) {
    benchmarks(hasResults: $hasResults) {
      name
      slug
    }
  }
`

interface BenchmarksPageProps {
  searchParams: {
    benchmark: string
  }
}

export default async function BenchmarksPage({
  searchParams,
}: BenchmarksPageProps) {
  const { benchmark } = searchParams

  const { data, loading: isLoading } = await getClient().query<{
    benchmarks: { name: string; slug: string }[]
  }>({
    query: GET_BENCHMARKS,
    variables: {
      benchmarkSlug: benchmark,
      hasResults: true,
    },
    errorPolicy: 'all',
  })

  const benchmarks = data?.benchmarks
  const selectedBenchmark =
    benchmarks.find((b) => b.slug === benchmark) ?? benchmarks[0]
  const selectedIndex = benchmarks.indexOf(selectedBenchmark)

  return (
    <div className="mx-auto space-y-4 px-4 py-10 sm:container">
      <ProductSelect />
      <BenchmarkSelect
        benchmarks={benchmarks}
        selectedBenchmark={selectedBenchmark}
        selectedIndex={selectedIndex}
      />
      <div className="w-full text-center">
        {isLoading ? (
          <Icons.Spinner className="animate-spin" />
        ) : (
          <BenchmarkChart benchmarkSlug={benchmark} />
        )}
      </div>
    </div>
  )
}
