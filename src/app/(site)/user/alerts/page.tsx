import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import { notFound } from 'next/navigation'

import { getCurrentUserToken } from '@/app/_actions/user'
import { UserCategoryAlertsForm } from '@/components/forms/user-category-alerts-form'
import { ProductsAlerts } from '@/components/products-alerts'
import { Separator } from '@/components/ui/separator'
import { AlertsPermission } from '@/components/user/user-alerts-permission'
import type { Category } from '@/types'

const GET_CATEGORIES_AND_USER_ALERTS = gql`
  query GetCategoriesAndUserAlerts {
    categories {
      id
      name
    }
    userAlerts {
      selectedCategories
    }
  }
`

export default async function AlertsPage() {
  const token = await getCurrentUserToken()
  if (!token) notFound()

  const { data } = await getClient().query<{
    categories: Pick<Category, 'name' | 'id'>[]
    userAlerts: {
      selectedCategories: string[]
    }
  }>({
    query: GET_CATEGORIES_AND_USER_ALERTS,
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    errorPolicy: 'ignore',
  })

  const categories = data?.categories ?? []
  const categoriesAlerts = data?.userAlerts?.selectedCategories ?? []

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
        <ProductsAlerts token={token} />
      </fieldset>
    </div>
  )
}
