import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { type RecommendedProduct, type Product } from '@/types'
import { DashboardRecommendationMain } from './main'

const GET_RECOMMENDATION_CATEGORIES = gql`
  query GetRecommendationCategories($includeRecommended: Boolean) {
    recommendationCategories(includeRecommended: $includeRecommended) {
      id
      name
      slug
      priceRangeProduct {
        id
        product {
          name
        }
        minPrice
        maxPrice
      }
    }
  }
`

export default async function RecommendationDashboardPage() {
  const { data } = await getClient().query<{
    recommendationCategories: {
      id: string
      name: string
      priceRangeProduct: (RecommendedProduct & { product: Product })[]
    }[]
  }>({
    query: GET_RECOMMENDATION_CATEGORIES,
    variables: {
      includeRecommended: true,
    },
  })

  const recommendationCategories = data.recommendationCategories

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Recomendações</h3>
        <p className="text-sm text-muted-foreground">
          Associe uma categoria e recomende produtos a uma dada faixa de preço.
        </p>
      </div>
      <Separator />
      <DashboardRecommendationMain
        recommendationCategories={recommendationCategories}
      />
    </div>
  )
}
