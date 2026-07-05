import { siteConfig } from '@/config/site'
import type { TelegramMessageInput } from '@/lib/validations/telegram'
import { priceCalculator } from '@/utils/price-calculator'

export interface SaleToTelegramInput {
  id: string
  slug: string
  title: string
  imageUrl: string
  price: number
  totalInstallmentPrice?: number
  installments?: number
  caption?: string
  label?: string
  review?: string
  /** Structured coupon code, or the legacy free-text coupon. */
  couponCode?: string
  /** Discount string of the selected coupon, e.g. "10%" or "100". */
  couponDiscount?: string
  cashback?: { value: number; provider: string; affiliatedUrl: string }
  /** Discount strings of the selected discounts, e.g. ["10%", "50"]. */
  discountValues: string[]
}

export function saleToTelegramMessage(
  input: SaleToTelegramInput,
): TelegramMessageInput {
  const cashbackPercent = input.cashback?.value
  const effectivePrice = priceCalculator(
    input.price,
    input.couponDiscount,
    cashbackPercent,
    input.discountValues,
  )
  const effectiveInstallmentPrice = input.totalInstallmentPrice
    ? priceCalculator(
        input.totalInstallmentPrice,
        input.couponDiscount,
        cashbackPercent,
        input.discountValues,
      )
    : undefined

  const priceCondition = input.couponCode
    ? `Com Cupom${input.cashback ? ' e Cashback' : ''}`
    : 'À Vista'

  return {
    imageUrl: input.imageUrl,
    title: input.title,
    price: effectivePrice,
    url: `${siteConfig.url}/promocao/${input.slug}/${input.id}`,
    coupon: input.couponCode || undefined,
    couponDiscount: undefined,
    applyCouponDiscount: false,
    maxCouponDiscount: undefined,
    priceCondition,
    highlight: input.label && input.label !== 'none' ? input.label : undefined,
    callout: undefined,
    caption: input.caption || undefined,
    note: undefined,
    totalInstallmentPrice: effectiveInstallmentPrice,
    installments: input.installments,
    // `#anúncio` is unconditional and unrelated to the sale's sponsored flag.
    sponsored: true,
    review: input.review || undefined,
    cashback: input.cashback,
  }
}
