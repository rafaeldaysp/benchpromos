import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/app/_actions/user'
import { AlertsForm } from '@/components/forms/user-alerts-form'
import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { type Category } from '@/types'
import { gql } from '@apollo/client'

const GET_CATEGORIES_AND_USER_ALERTS = gql`
  query GetCategoriesAndUserAlerts($userId: String!) {
    categories {
      id
      name
    }
    userAlerts(id: $userId) {
      selectedCategories
      subscribedProducts {
        id
        imageUrl
        deals {
          price
        }
      }
    }
  }
`

export default async function AlertsPage() {
  const user = await getCurrentUser()

  if (!user) notFound()

  const { data } = await getClient().query<{
    categories: Pick<Category, 'name' | 'id'>[]
    userAlerts: {
      selectedCategories: string[]
      subscribedProducts: {
        id: string
        imageUrl: number
        deals: { price: number }[]
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
  const initialAlerts = data?.userAlerts

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Alertas</h3>
        <p className="text-sm text-muted-foreground">
          Ative ou desative alertas desejados.
        </p>
      </div>
      <Separator />
      <AlertsForm categories={categories} initialAlerts={initialAlerts} />
    </div>
  )
}
