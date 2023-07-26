import { gql } from '@apollo/client'

import { SaleCard } from '@/components/sale-card'
import { getClient } from '@/lib/apollo'
import type { Category, Comment, Sale } from '@/types'

const GET_SALES = gql`
  query GetSales {
    sales {
      id
      title
      slug
      imageUrl
      url
      price
      installments
      totalInstallmentPrice
      caption
      review
      label
      coupon
      cashback
      createdAt
      categoryId
      productSlug
      category {
        name
        slug
      }
      comments {
        id
      }
      reactions {
        content
        users {
          id
        }
      }
    }
  }
`

export default async function Home() {
  const response = await getClient().query<{
    sales: (Sale & {
      category: Pick<Category, 'name' | 'slug'>
      comments: Pick<Comment, 'id'>[]
      reactions: { content: string; users: { id: string }[] }[]
    })[]
  }>({
    query: GET_SALES,
  })

  const sales = response.data.sales

  return (
    <div className="px-4 sm:container">
      <div className="my-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sales.map((sale) => (
          <SaleCard key={sale.id} sale={sale} />
        ))}
      </div>
    </div>
  )
}
