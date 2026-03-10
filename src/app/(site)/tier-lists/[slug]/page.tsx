import { gql } from '@apollo/client'
import { notFound } from 'next/navigation'

import { getClient } from '@/lib/apollo'
import type { Category, Product, Tier, TierList, TierProduct } from '@/types'
import { getCurrentUser } from '@/app/_actions/user'
import { TierListMain } from './main'

const GET_TIER_LIST = gql`
  query GetTierList($slug: String!) {
    tierList(slug: $slug) {
      id
      title
      slug
      description
      categoryId
      createdAt
      updatedAt
      category {
        id
        name
        slug
      }
      tiers {
        id
        name
        color
        priceLimit
        position
        products {
          id
          position
          note
          product {
            id
            name
            imageUrl
            slug
            categoryId
            deals {
              price
              availability
              retailer {
                name
              }
              coupon {
                code
                discount
                availability
              }
              cashback {
                value
                provider
              }
              discounts {
                discount
              }
            }
          }
        }
      }
    }
  }
`

type TierListProductDeal = {
  price: number
  availability: boolean
  retailer: { name: string }
  coupon: { code: string; discount: string; availability: boolean }
  cashback: { value: number; provider: string }
  discounts: { discount: string }[]
}

type TierListData = TierList & {
  category: Pick<Category, 'id' | 'name' | 'slug'>
  tiers: (Tier & {
    products: (TierProduct & {
      product: Pick<
        Product,
        'id' | 'name' | 'imageUrl' | 'slug' | 'categoryId'
      > & { deals: TierListProductDeal[] }
    })[]
  })[]
}

interface TierListPageProps {
  params: { slug: string }
}

export default async function TierListPage({ params }: TierListPageProps) {
  const { data } = await getClient().query<{
    tierList: TierListData | null
  }>({
    query: GET_TIER_LIST,
    variables: { slug: params.slug },
  })

  if (!data.tierList) {
    notFound()
  }

  const user = await getCurrentUser()
  const isAdmin = user?.role === 'ADMIN'

  console.log('is admin: ', isAdmin)

  return (
    <div>
      <TierListMain tierList={data.tierList} isAdmin={isAdmin} />
    </div>
  )
}
