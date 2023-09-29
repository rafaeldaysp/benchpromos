import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import { notFound } from 'next/navigation'

import { getCurrentUser, getCurrentUserToken } from '@/app/_actions/user'
import { UserCategoryAlertsForm } from '@/components/forms/user-category-alerts-form'
import { ProductAlertCard } from '@/components/product-alert-card'
import { Separator } from '@/components/ui/separator'
import { AlertsPermission } from '@/components/user/user-alerts-permission'
import type { Category } from '@/types'

const GET_CATEGORIES_AND_USER_ALERTS = gql`
  query GetCategoriesAndUserAlerts($userId: String!) {
    categories {
      id
      name
    }
    userAlerts(id: $userId) {
      selectedCategories
      subscribedProducts {
        subscribedPrice
        product {
          id
          name
          slug
          imageUrl
          deals {
            price
          }
        }
      }
    }
  }
`

export default async function AlertsPage() {
  const user = await getCurrentUser()
  const token = await getCurrentUserToken()
  if (!user) notFound()

  const { data } = await getClient().query<{
    categories: Pick<Category, 'name' | 'id'>[]
    userAlerts: {
      selectedCategories: string[]
      subscribedProducts: {
        subscribedPrice: number
        product: {
          id: string
          imageUrl: string
          slug: string
          name: string
          deals: { price: number }[]
        }
      }[]
    }
  }>({
    query: GET_CATEGORIES_AND_USER_ALERTS,
    variables: {
      userId: user.id,
    },
    errorPolicy: 'ignore',
  })

  const categories = data?.categories ?? []
  const categoriesAlerts = data?.userAlerts?.selectedCategories ?? []
  const productsAlerts = data?.userAlerts?.subscribedProducts ?? []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Alertas</h3>
        <p className="text-sm text-muted-foreground">
          Ative ou desative alertas desejados.
        </p>
      </div>
      <Separator />
      <AlertsPermission token={token} />
      <UserCategoryAlertsForm
        selectedCategories={categoriesAlerts}
        categories={categories}
      />
      <fieldset className="space-y-2">
        <div className="mb-4">
          <h3 className="text-base font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Alertas por produto
          </h3>
          <h6 className="text-[0.8rem] text-muted-foreground">
            Receba notificações quando o(s) produto(s) alcançar(em) o preço
            desejado.
          </h6>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 ">
          {productsAlerts.map((productAlert) => (
            <ProductAlertCard
              key={productAlert.product.id}
              product={productAlert.product}
              subscribedPrice={productAlert.subscribedPrice}
            />
          ))}
        </div>
      </fieldset>
    </div>
  )
}
