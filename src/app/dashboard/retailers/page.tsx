import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { Retailer } from '@/types'
import { RetailersMain } from './main'

const GET_RETAILERS = gql`
  {
    getRetailers {
      __typename
      ... on RetailerList {
        retailers {
          id
          name
        }
      }
      ... on Error {
        message
      }
    }
  }
`

export default async function RetailersDashboardPage() {
  const response = await getClient().query<{
    getRetailers: {
      __typename: string
      retailers: Retailer[]
    }
  }>({
    query: GET_RETAILERS,
  })

  const retailers = response.data.getRetailers.retailers

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Anunciantes</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um anunciante.
        </p>
      </div>
      <Separator />
      <RetailersMain retailers={retailers} />
    </div>
  )
}
