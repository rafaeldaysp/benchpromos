export const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
})

export const couponFormatter = (couponDiscount: string) => {
  const discountArray = couponDiscount.split('+')
  const formatedDiscountArray = discountArray
    .map((discount) =>
      discount.includes('%')
        ? discount
        : priceFormatter.format(Number(discount)),
    )
    .sort((a, b) => b.length - a.length)
  return formatedDiscountArray.join(' + ')
}
