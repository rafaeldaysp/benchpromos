import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type { Category, Product, Sale } from '@/types'
import { removeNullValues } from '@/utils'
import { SalesMain } from './main'

const GET_SALES_AND_PRODUCT = gql`
  query GetSalesAndProduct {
    sales {
      list {
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
        productSlug
        product {
          name
          slug
          imageUrl
          category {
            id
            name
          }
        }
      }
    }
  }
`

export default async function SalesDashboardPage() {
  const { data } = await getClient().query<{
    sales: {
      list: (Sale & {
        product: Pick<Product, 'slug' | 'name' | 'imageUrl'> & {
          category: Pick<Category, 'id' | 'name'>
        }
      })[]
    }
  }>({
    query: GET_SALES_AND_PRODUCT,
  })

  const sales = data.sales.list.map((sale) => removeNullValues(sale))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Promoções</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de uma promoção.
        </p>
      </div>
      <Separator />
      <SalesMain sales={sales} />
    </div>
  )
}
