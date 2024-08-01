import { gql } from '@apollo/client'

import { getClient } from '@/lib/apollo'
import { type Product } from '@/types'
import { RecommendedMain } from './main'
import { RecommendedProductsChart } from './recommendations-chart'
import { Separator } from '@/components/ui/separator'

const GET_RECOMMENDATION_CATEGORIES = gql`
  query GetRecommendationCategories {
    recommendationCategories {
      id
      name
      slug
    }
  }
`

const GET_RECOMMENDED_PRODUCTS = gql`
  query GetRecommendationsByCategory($categoryId: String!) {
    recommendationsByCategory(categoryId: $categoryId) {
      product {
        name
      }
      minPrice
      maxPrice
      category {
        name
      }
    }
  }
`

interface RecommendationsPageProps {
  searchParams: {
    category?: string
  }
}

export default async function RecommendationsPage({
  searchParams,
}: RecommendationsPageProps) {
  const { data } = await getClient().query<{
    recommendationCategories: {
      id: string
      name: string
      slug: string
    }[]
  }>({
    query: GET_RECOMMENDATION_CATEGORIES,
  })

  const targetCategory = searchParams.category ?? ''

  const { data: recommendedProducts } = await getClient().query<{
    recommendationsByCategory: {
      id: string
      product: Product
      minPrice: number
      maxPrice: number
      category: {
        name: string
      }
    }[]
  }>({
    query: GET_RECOMMENDED_PRODUCTS,
    variables: {
      categoryId: targetCategory,
    },
  })

  const recommendationCategories = data.recommendationCategories

  const formattedRecommendedProducts =
    recommendedProducts.recommendationsByCategory.map((recommended) => ({
      ...recommended,
      minPrice: recommended.minPrice / 100,
      maxPrice: recommended.maxPrice / 100,
    }))

  return (
    <div className="my-10 px-4 sm:container">
      <main className="space-y-4">
        <div className="space-y-0.5">
          <h3 className="font-medium">Recomendações</h3>
          <p className="text-sm text-muted-foreground">
            Conheça os produtos recomendamos para cada faixa de preço
          </p>
        </div>
        <Separator />
        <RecommendedMain recommendationCategories={recommendationCategories} />
        {formattedRecommendedProducts.length > 0 && (
          <RecommendedProductsChart chartData={formattedRecommendedProducts} />
        )}
      </main>
    </div>
  )
}
