import { gql, useMutation, useQuery } from '@apollo/client'
import { toast } from 'sonner'

import { useAuthHeaders } from '@/components/auth-token-provider'

const ACTIVE_SALES_COUNT_BY_COUPON = gql`
  query ActiveSalesCountByCoupon($couponId: ID!) {
    activeSalesCountByCoupon(couponId: $couponId)
  }
`

const EXPIRE_SALES_BY_COUPON = gql`
  mutation ExpireSalesByCoupon($couponId: ID!) {
    expireSalesByCoupon(couponId: $couponId)
  }
`

/**
 * Active-sale count for a coupon (fetched only while `enabled`) and an action
 * that expires all of them. `expireSales` resolves to the number expired, or
 * null on error (already toasted).
 */
export function useExpireCouponSales(couponId: string, enabled: boolean) {
  const authHeaders = useAuthHeaders()
  const context = { headers: { ...authHeaders } }

  const { data, loading: isCounting } = useQuery<{
    activeSalesCountByCoupon: number
  }>(ACTIVE_SALES_COUNT_BY_COUPON, {
    variables: { couponId },
    skip: !enabled,
    fetchPolicy: 'network-only',
    context,
  })

  const [mutate, { loading: isExpiring }] = useMutation<{
    expireSalesByCoupon: number
  }>(EXPIRE_SALES_BY_COUPON, {
    variables: { couponId },
    context,
    refetchQueries: ['GetSales', 'GetDashboardSales'],
    onError(error) {
      toast.error(error.message)
    },
  })

  async function expireSales() {
    const { data } = await mutate()
    const count = data?.expireSalesByCoupon
    if (count === undefined) return null
    toast.success(
      count === 1
        ? '1 promoção marcada como expirada.'
        : `${count} promoções marcadas como expiradas.`,
    )
    return count
  }

  return {
    activeSalesCount: data?.activeSalesCountByCoupon,
    isCounting,
    expireSales,
    isExpiring,
  }
}
