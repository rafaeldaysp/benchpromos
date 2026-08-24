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

// No length caps here on purpose. The only real limits are the per-channel
// message limits, and those are enforced by truncating the *built* post right
// before it is sent (see `truncateForChannel` in `lib/telegram.ts`). A cap on
// an individual field can't express that limit — it only turns a post that
// would have been truncated into a hard 400, after the sale was already
// created.
function optionalText() {
  return z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().optional(),
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
  title: z.string().min(1, 'Campo obrigatório').trim(),
  price: priceSchema,
  url: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço inválido')
    .refine(isHttpUrl, 'Endereço inválido'),
  coupon: optionalText(),
  couponDiscount: optionalText().refine(
    (value) => !value || isTelegramCouponDiscountParseable(value),
    'Use um desconto como 10%, 100 ou 10% + 100',
  ),
  applyCouponDiscount: z.boolean().default(true),
  maxCouponDiscount: optionalCentsSchema,
  priceCondition: optionalText(),
  highlight: optionalText(),
  callout: optionalText(),
  caption: optionalText(),
  note: optionalText(),
  totalInstallmentPrice: optionalCentsSchema,
  installments: z.preprocess(
    toOptionalPositiveInt,
    z.number().int().positive('Campo obrigatório').optional(),
  ),
  sponsored: z.boolean().default(true),
  monospaceCoupon: z.boolean().default(true),
  review: optionalText(),
  // Already subtracted from `price` by the caller; carried here only so the
  // post can tell the reader where the lower price comes from.
  discounts: z
    .array(
      z.object({
        discount: z.string().min(1),
        label: optionalText(),
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
