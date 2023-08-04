import * as z from 'zod'

export const dealSchema = z.object({
  price: z.coerce.number().int('Preço inváçido'),
  availability: z.boolean(),
  url: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório')
    .url('Endereço inválido'),
  installments: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Número inválido')
    .optional(),
  totalInstallmentPrice: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Número inválido')
    .optional(),
  sku: z.string().optional(),
  couponId: z.string().optional(),
  cashbackId: z.string().optional(),
})

export const dealsLinkSchema = z.object({
  couponId: z.string().optional(),
  cashbackId: z.string().optional(),
})
