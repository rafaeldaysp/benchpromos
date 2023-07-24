import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { type Cashback } from '@/types'
import { CashbacksMain } from './main'

const GET_CASHBACKS = gql`
  query GetCashbacks {
    cashbacks {
      id
      provider
      value
      url
      affiliatedUrl
      retailerId
    }
  }
`

export default async function CashbacksDashboardPage() {
  const response = await getClient().query<{
    cashbacks: Cashback[]
  }>({
    query: GET_CASHBACKS,
  })

  const cashbacks = response.data.cashbacks

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Cashbacks</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um cashback.
        </p>
      </div>
      <Separator />
      <CashbacksMain cashbacks={cashbacks} />
    </div>
  )
}
