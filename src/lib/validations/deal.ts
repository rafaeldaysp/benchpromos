import * as z from 'zod'

export const dealSchema = z.object({
  price: z.coerce
    .number({
      required_error: 'Campo obrigatório',
      invalid_type_error: 'Valor inválido',
    })
    .int(),
  availability: z.boolean().default(true),
  url: z.string().min(1, 'Campo obrigatório').url('Endereço inválido'),
  installments: z.coerce.number().int().optional(),
  totalInstallmentPrice: z.coerce.number().int().optional(),
  sku: z.string().optional(),
  couponId: z.string().optional(),
  cashbackId: z.string().optional(),
})

export const dealsLinkSchema = z.object({
  couponId: z.string().optional(),
  cashbackId: z.string().optional(),
})
