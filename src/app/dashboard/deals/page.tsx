import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type { Category, Retailer } from '@/types'
import { DealsMain } from './main'

const GET_DEALS_DASHBOARD = gql`
  query GetDealsDashboard {
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
    retailers: Retailer[]
    categories: Pick<Category, 'id' | 'name'>[]
  }>({
    query: GET_DEALS_DASHBOARD,
  })

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
      <DealsMain retailers={retailers} categories={categories} />
    </div>
  )
}
