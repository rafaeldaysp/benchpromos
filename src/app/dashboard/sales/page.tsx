import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { type Category, type Product, type Sale } from '@/types'
import { removeNullValues } from '@/utils'
import { SalesMain } from './main'

const GET_SALES_AND_PRODUCTS = gql`
  query GetSalesAndProducts {
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
      productSlug
    }
    productsList: products {
      pages
      products {
        name
        slug
        imageUrl
        category {
          name
        }
      }
    }
  }
`

export default async function SalesDashboardPage() {
  const { data } = await getClient().query<{
    sales: Sale[]
    productsList: {
      products: (Pick<Product, 'slug' | 'name' | 'imageUrl'> & {
        category: Pick<Category, 'name'>
      })[]
    }
  }>({
    query: GET_SALES_AND_PRODUCTS,
  })

  const sales = data.sales.map((sale) => removeNullValues(sale))
  const products = data.productsList.products

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
