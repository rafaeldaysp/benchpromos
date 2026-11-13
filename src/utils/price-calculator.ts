/** A coupon's discount ("10%" or "50" for R$ 50) plus an optional cap in cents. */
export type CouponPricing = {
  discount: string
  maximumDiscount?: number | null
}

/**
 * Coupon discount in cents for a given price. `maximumDiscount` caps the
 * result only when set (> 0), so coupons without a cap keep the old math.
 */
export const couponDiscountCents = (
  fullPrice: number,
  coupon?: CouponPricing | string | null,
) => {
  if (!coupon) return 0
  const { discount, maximumDiscount }: CouponPricing =
    typeof coupon === 'string' ? { discount: coupon } : coupon
  if (!discount) return 0

  const value = discount.includes('%')
    ? (parseFloat(discount.split('%', 1)[0]) / 100) * fullPrice
    : parseFloat(discount) * 100

  return maximumDiscount && maximumDiscount > 0
    ? Math.min(value, maximumDiscount)
    : value
}

export const priceCalculator = (
  fullPrice?: number,
  coupon?: CouponPricing | string | null,
  cashbackPercent?: number,
  discountValues?: string[],
) => {
  if (!fullPrice) return 0
  let price = fullPrice - couponDiscountCents(fullPrice, coupon)

  discountValues?.forEach((discount) => {
    if (discount.includes('%')) {
      price -= (parseFloat(discount.split('%', 1)[0]) / 100) * price
    } else {
      price -= parseFloat(discount) * 100
    }
  })

  if (cashbackPercent) price -= (price * cashbackPercent) / 100

  return Math.round(price)
}
