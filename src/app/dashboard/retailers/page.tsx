import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type { Retailer } from '@/types'
import { RetailersMain } from './main'

const GET_RETAILERS = gql`
  query GetRetailers {
    retailers {
      id
      name
    }
  }
`

export default async function RetailersDashboardPage() {
  const { data } = await getClient().query<{
    retailers: Retailer[]
  }>({
    query: GET_RETAILERS,
  })

  const retailers = data.retailers

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Varejistas</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um varejista.
        </p>
      </div>
      <Separator />
      <RetailersMain retailers={retailers} />
    </div>
  )
}
