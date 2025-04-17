import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type { Discount, Retailer } from '@/types'
import { removeNullValues } from '@/utils'
import { DiscountsMain } from './main'

const GET_DISCOUNTS = gql`
  query GetDiscounts {
    discounts {
      id
      discount
      retailerId
      description
      updatedAt
      label
      retailer {
        name
      }
    }
  }
`

export default async function DiscountsDashboardPage() {
  const { data } = await getClient().query<{
    discounts: (Discount & { retailer: Pick<Retailer, 'name'> })[]
  }>({
    query: GET_DISCOUNTS,
  })

  const discounts = data.discounts.map((discount) => removeNullValues(discount))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Descontos</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um desconto.
        </p>
      </div>
      <Separator />
      <DiscountsMain discounts={discounts} />
    </div>
  )
}
