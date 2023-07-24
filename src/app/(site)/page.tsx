import { gql } from '@apollo/client'

import { getClient } from '@/lib/apollo'
import { type Category, type Sale } from '@/types'
import { SaleCard } from '@/components/sale-card'

const GET_SALES = gql`
  query GetSales {
    sales {
      id
      title
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
      productId
      category {
        name
      }
    }
  }
`

export default async function Home() {
  const response = await getClient().query<{
    sales: (Sale & { category: Category })[]
  }>({
    query: GET_SALES,
  })

  const sales = response.data.sales

  return (
    <div className="px-4 sm:container">
      <div className="my-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SaleCard sale={sales[0]} />
        <SaleCard sale={sales[0]} />
        <SaleCard sale={sales[0]} />
        <SaleCard sale={sales[0]} />
      </div>
    </div>
  )
}
