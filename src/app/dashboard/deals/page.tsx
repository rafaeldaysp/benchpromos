import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import {
  type Cashback,
  type Coupon,
  type Deal,
  type Product,
  type Retailer,
} from '@/types'
import { removeNullValues } from '@/utils'
import { DealsMain } from './main'

const GET_DEALS_AND_PRODUCTS_AND_RETAILERS = gql`
  query GetDealsAndProductsAndRetailers {
    deals {
      id
      price
      availability
      url
      installments
      totalInstallmentPrice
      sku
      productId
      retailerId
      couponId
      cashbackId
      createdAt
      updatedAt
      cashback {
        value
      }
      coupon {
        discount
      }
    }
    productsList: products {
      products {
        id
        name
        imageUrl
      }
    }
    retailers {
      id
      name
    }
  }
`

export default async function DealsDashboardPage() {
  const response = await getClient().query<{
    deals: (Deal & { cashback?: Pick<Cashback, 'value'> } & {
      coupon?: Pick<Coupon, 'discount'>
    })[]
    productsList: {
      products: Pick<Product, 'id' | 'name' | 'imageUrl'>[]
    }
    retailers: Retailer[]
  }>({
    query: GET_DEALS_AND_PRODUCTS_AND_RETAILERS,
  })

  const deals = response.data.deals.map((deal) => removeNullValues(deal))
  const products = response.data.productsList.products
  const retailers = response.data.retailers

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Anúncios</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um anúncio.
        </p>
      </div>
      <Separator />
      <DealsMain deals={deals} products={products} retailers={retailers} />
    </div>
  )
}
