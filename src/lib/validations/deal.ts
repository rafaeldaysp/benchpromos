import * as z from 'zod'

export const dealSchema = z.object({
  price: z.coerce.number().int(),
  availability: z.boolean(),
  url: z.string().min(1),
  installments: z.coerce.number().int().optional(),
  totalInstallmentPrice: z.coerce.number().int().optional(),
  sku: z.string().optional(),
  couponId: z.string().optional(),
  cashbackId: z.string().optional(),
})

export const AssigntoDealsSchema = z.object({
  couponId: z.string().optional(),
  cashbackId: z.string().optional(),
})
