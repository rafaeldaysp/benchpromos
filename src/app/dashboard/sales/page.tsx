import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { Category, Product, Sale } from '@/types'
import { removeNullValues } from '@/utils'
import { SalesMain } from './main'

const GET_SALES_AND_PRODUCTS = gql`
  query Sales {
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
    }
    products {
      id
      name
      imageUrl
      category {
        name
      }
    }
  }
`

export default async function SalesDashboardPage() {
  const response = await getClient().query<{
    sales: Sale[]
    products: (Pick<Product, 'id' | 'name' | 'imageUrl'> & {
      category: Pick<Category, 'name'>
    })[]
  }>({
    query: GET_SALES_AND_PRODUCTS,
  })

  const sales = response.data.sales.map((sale) => removeNullValues(sale))
  const products = response.data.products

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Promoções</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de uma promoção.
        </p>
      </div>
      <Separator />
      <SalesMain sales={sales} products={products} />
    </div>
  )
}
