import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import { notFound } from 'next/navigation'

import { getCurrentUserToken } from '@/app/_actions/user'
import { ProductCard } from '@/components/product-card'
import { Separator } from '@/components/ui/separator'
import type {
  Cashback,
  Category,
  Coupon,
  Deal,
  Product,
  Retailer,
} from '@/types'

const GET_USER_FAVORITED_PRODUCTS = gql`
  query GetUserFavoritedProducts($input: GetProductsInput) {
    productsList: favoritedProducts(getProductsInput: $input) {
      products {
        id
        name
        imageUrl
        slug
        reviewUrl
        category {
          slug
        }
        deals {
          price
          totalInstallmentPrice
          installments
          availability
          saleId
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
          saleId
        }
      }
    }
  }
`

export default async function AlertsPage() {
  const token = await getCurrentUserToken()
  if (!token) notFound()

  const { data } = await getClient().query<{
    productsList: {
      products: (Product & {
        category: Pick<Category, 'slug'>
        deals: (Pick<
          Deal,
          | 'price'
          | 'availability'
          | 'installments'
          | 'totalInstallmentPrice'
          | 'saleId'
        > & { retailer: Pick<Retailer, 'name'> } & {
          coupon: Pick<Coupon, 'code' | 'discount' | 'availability'>
        } & { cashback: Pick<Cashback, 'value' | 'provider'> })[]
      })[]
    }
  }>({
    query: GET_USER_FAVORITED_PRODUCTS,
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      input: {
        // hasDeals: true,
      },
    },
    errorPolicy: 'ignore',
  })

  const products = data.productsList.products

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Favoritos</h3>
        <p className="text-sm text-muted-foreground">
          Produtos que você marcou como favorito.
        </p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 justify-center gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
