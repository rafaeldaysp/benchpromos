export const priceCalculator = (
  fullPrice: number,
  couponDiscountStr?: string,
  cashbackPercent?: number,
) => {
  let couponDiscount = 0
  if (couponDiscountStr)
    couponDiscount = couponDiscountStr.includes('%')
      ? (parseFloat(couponDiscountStr.split('%', 1)[0]) / 100) * fullPrice
      : parseFloat(couponDiscountStr) * 100

  let cashbackDiscount = 0
  if (cashbackPercent)
    cashbackDiscount = ((fullPrice - couponDiscount) * cashbackPercent) / 100

  return fullPrice - couponDiscount - cashbackDiscount
}
