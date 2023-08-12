import * as z from 'zod'

export const saleSchema = z.object({
  title: z.string().min(1, 'Campo obrigatório'),
  imageUrl: z.string().min(1, 'Campo obrigatório'),
  categoryId: z.string({ required_error: 'Selecione uma categoria' }),
  price: z.coerce.number().int().gt(0),
  url: z.string().min(1, 'Campo obrigatório').url('Endereço inválido'),
  installments: z.coerce.number().int().optional(),
  totalInstallmentPrice: z.coerce.number().int().optional(),
  caption: z.string().optional(),
  review: z.string().optional(),
  label: z.string().optional(),
  coupon: z.string().optional(),
  cashback: z.string().optional(),
})
