import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type {
  Cashback,
  Category,
  Coupon,
  Deal,
  Discount,
  Product,
  Retailer,
  Sale,
} from '@/types'
import { removeNullValues } from '@/utils'
import { DealsMain } from './main'

const GET_DEALS = gql`
  query GetDeals {
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
      retailerIsSeller
      lastScrapedAt
      lastScrapedMessage
      scrapingStatus
      cashback {
        provider
        value
      }
      coupon {
        discount
        code
      }
      discounts {
        id
        label
        discount
        retailerId
      }
      product {
        id
        name
        imageUrl
        category {
          id
          name
        }
      }
      saleId
      sale {
        expired
      }
    }
    retailers {
      id
      name
    }
    categories {
      id
      name
    }
  }
`

export default async function DealsDashboardPage() {
  const { data } = await getClient().query<{
    deals: (Deal & {
      cashback?: Pick<Cashback, 'value' | 'provider'>
      coupon?: Pick<Coupon, 'discount' | 'code'>
      discounts: Discount[]
      product: Pick<Product, 'id' | 'name' | 'imageUrl'> & {
        category: Pick<Category, 'id' | 'name'>
      }
    })[]
    retailers: Retailer[]
    categories: Pick<Category, 'id' | 'name'>[]
    sales: Pick<Sale, 'expired'>[]
  }>({
    query: GET_DEALS,
  })

  const deals = data.deals.map((deal) => removeNullValues(deal))
  const retailers = data.retailers
  const categories = data.categories

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Ofertas</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de uma oferta.
        </p>
      </div>
      <Separator />
      <DealsMain deals={deals} retailers={retailers} categories={categories} />
    </div>
  )
}
