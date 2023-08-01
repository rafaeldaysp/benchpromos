import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { type Coupon, type Retailer } from '@/types'
import { removeNullValues } from '@/utils'
import { CouponsMain } from './main'

const GET_COUPONS = gql`
  query GetCoupons {
    coupons {
      id
      availability
      code
      discount
      retailerId
      minimumSpend
      description
      retailer {
        name
      }
    }
  }
`

export default async function CouponsDashboardPage() {
  const { data } = await getClient().query<{
    coupons: (Coupon & { retailer: Pick<Retailer, 'name'> })[]
  }>({
    query: GET_COUPONS,
  })

  const coupons = data.coupons.map((coupon) => removeNullValues(coupon))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Cupons</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um cupom.
        </p>
      </div>
      <Separator />
      <CouponsMain coupons={coupons} />
    </div>
  )
}
