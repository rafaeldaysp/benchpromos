'use client'

import { gql, useSuspenseQuery } from '@apollo/client'

import { type Cashback, type Coupon, type Product } from '@/types'
import { ProductAlertCard } from './product-alert-card'

const GET_PRODUCTS_ALERTS = gql`
  query GetProductsAlerts {
    userAlerts {
      subscribedProducts {
        price
        product {
          id
          name
          slug
          imageUrl
          deals {
            price
            availability
            coupon {
              discount
              availability
            }
            cashback {
              value
            }
          }
        }
      }
    }
  }
`
interface ProductsAlertsProps {
  token?: string
}
export function ProductsAlerts({ token }: ProductsAlertsProps) {
  const { data } = useSuspenseQuery<{
    userAlerts: {
      subscribedProducts: {
        price: number
        product: Pick<Product, 'id' | 'imageUrl' | 'slug' | 'name'> & {
          deals: {
            price: number
            availability: boolean
            coupon: Coupon
            cashback: Cashback
          }[]
        }
      }[]
    }
  }>(GET_PRODUCTS_ALERTS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
  const productsAlerts = data?.userAlerts?.subscribedProducts ?? []
  return (
    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 ">
      {productsAlerts.map((productAlert) => (
        <ProductAlertCard
          key={productAlert.product.id}
          product={productAlert.product}
          subscribedPrice={productAlert.price}
        />
      ))}
    </div>
  )
}
