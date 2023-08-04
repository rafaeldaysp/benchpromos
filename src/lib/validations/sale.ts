import * as z from 'zod'

export const saleSchema = z.object({
  title: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório'),
  imageUrl: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório'),
  categoryId: z
    .string({ required_error: 'Selecione uma categoria' })
    .min(1, 'Categoria inválida'),
  price: z.coerce.number().int('Preço inválido'),
  url: z.string().min(1, 'Campo obrigatório').url('Endereço inválido'),
  installments: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Número inválido')
    .optional(),
  totalInstallmentPrice: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Número inválido')
    .optional(),
  caption: z.string().optional(),
  review: z.string().optional(),
  label: z.string().optional(),
  coupon: z.string().optional(),
  cashback: z.string().optional(),
  productSlug: z.string().optional(),
})
