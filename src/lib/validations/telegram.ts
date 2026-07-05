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

const centsSchema = z.preprocess(
  (value) => (value === '' || value == null ? undefined : Number(value)),
  z
    .number({
      invalid_type_error: 'Campo obrigatório',
      required_error: 'Campo obrigatório',
    })
    .int()
    // 0 is allowed (e.g. giveaways) — the price line is then hidden in the post.
    .min(0, 'Campo obrigatório'),
)

const optionalCentsSchema = z.preprocess(
  (value) => (value === '' || value == null ? undefined : Number(value)),
  z.number().int().positive('Campo obrigatório').optional(),
)

export const telegramMessageSchema = z.object({
  imageUrl: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço inválido')
    .refine(isHttpUrl, 'Endereço inválido'),
  title: z.string().min(1, 'Campo obrigatório').max(180).trim(),
  price: centsSchema,
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
    (value) => (value === '' || value == null ? undefined : Number(value)),
    z.number().int().positive('Campo obrigatório').optional(),
  ),
  sponsored: z.boolean().default(true),
  review: optionalText(2000),
  cashback: z
    .object({
      value: z.number(),
      provider: z.string().min(1),
      affiliatedUrl: z.string().min(1),
    })
    .optional(),
})

export type TelegramMessageInput = z.infer<typeof telegramMessageSchema>
