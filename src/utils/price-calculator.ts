export const priceCalculator = (
  fullPrice?: number,
  couponDiscountStr?: string,
  cashbackPercent?: number,
  discountValues?: string[],
) => {
  if (!fullPrice) return 0
  let price = fullPrice
  let couponDiscount = 0
  if (couponDiscountStr)
    couponDiscount = couponDiscountStr.includes('%')
      ? (parseFloat(couponDiscountStr.split('%', 1)[0]) / 100) * fullPrice
      : parseFloat(couponDiscountStr) * 100

  price = fullPrice - couponDiscount

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
