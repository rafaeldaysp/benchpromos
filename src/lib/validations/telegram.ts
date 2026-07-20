import * as z from 'zod'

import { isTelegramCouponDiscountParseable } from '@/lib/telegram'

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function optionalText(maxLength: number) {
  return z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().max(maxLength).trim().optional(),
  )
}

// Price is optional. Empty / null / non-numeric falls back to 0, which hides
// the price line in the post (e.g. giveaways).
const priceSchema = z.preprocess((value) => {
  if (value === '' || value == null) return 0

  const num = Number(value)

  return Number.isFinite(num) ? num : 0
}, z.number().int().min(0))

// Treat empty / null / 0 / non-numeric as "not provided". Callers (e.g. the
// sale form) default empty number fields to 0, which must not fail an
// optional-positive field.
function toOptionalPositiveInt(value: unknown) {
  if (value === '' || value == null) return undefined

  const num = Number(value)

  return Number.isFinite(num) && num > 0 ? num : undefined
}

const optionalCentsSchema = z.preprocess(
  toOptionalPositiveInt,
  z.number().int().positive('Campo obrigatório').optional(),
)

export const telegramMessageSchema = z.object({
  imageUrl: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço inválido')
    .refine(isHttpUrl, 'Endereço inválido'),
  title: z.string().min(1, 'Campo obrigatório').max(180).trim(),
  price: priceSchema,
  url: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço inválido')
    .refine(isHttpUrl, 'Endereço inválido'),
  coupon: optionalText(80),
  couponDiscount: optionalText(80).refine(
    (value) => !value || isTelegramCouponDiscountParseable(value),
    'Use um desconto como 10%, 100 ou 10% + 100',
  ),
  applyCouponDiscount: z.boolean().default(true),
  maxCouponDiscount: optionalCentsSchema,
  priceCondition: optionalText(80),
  highlight: optionalText(80),
  callout: optionalText(140),
  caption: optionalText(220),
  note: optionalText(180),
  totalInstallmentPrice: optionalCentsSchema,
  installments: z.preprocess(
    toOptionalPositiveInt,
    z.number().int().positive('Campo obrigatório').optional(),
  ),
  sponsored: z.boolean().default(true),
  review: optionalText(2000),
  // Already subtracted from `price` by the caller; carried here only so the
  // post can tell the reader where the lower price comes from.
  discounts: z
    .array(
      z.object({
        discount: z.string().min(1),
        label: optionalText(80),
      }),
    )
    .optional(),
  cashback: z
    .object({
      value: z.number(),
      provider: z.string().min(1),
      affiliatedUrl: z.string().min(1),
    })
    .optional(),
})

export type TelegramMessageInput = z.infer<typeof telegramMessageSchema>
