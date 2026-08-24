import * as z from 'zod'

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const saleSchema = z.object({
  title: z
    .string()
    .min(1, 'Campo obrigatório')
    .transform((str) => str.replace(/[^\x00-\xFF]/g, '').trim()),
  // Must be an absolute http(s) URL: the share endpoints require one (Telegram
  // fetches it by URL), and next/image only accepts absolute remote sources.
  // Validating it here means a sale can never be saved with an image that the
  // share step would then reject.
  imageUrl: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço inválido')
    .refine(isHttpUrl, 'Endereço inválido'),
  categoryId: z.string({ required_error: 'Selecione uma categoria' }),
  retailerId: z.string({ required_error: 'Selecione um varejista' }),
  price: z.coerce.number().int().gt(-1),
  url: z.string().min(1, 'Campo obrigatório').url('Endereço inválido'),
  installments: z.coerce.number().int().optional(),
  totalInstallmentPrice: z.coerce.number().int().optional(),
  caption: z
    .string()
    .transform((str) => str.replace(/[^\x00-\xFF]/g, '').trim())
    .optional(),
  review: z
    .string()
    .transform((str) => str.replace(/[^\x00-\xFF]/g, '').trim())
    .optional(),
  tag: z
    .string()
    .transform((str) => str.replace(/[^\x00-\xFF]/g, '').trim())
    .optional(),
  label: z.string().optional(),
  coupon: z.string().optional(),
  couponId: z.string().optional(),
  cashbackId: z.string().optional(),
  discountIds: z.array(z.string()).optional(),
  sponsored: z.boolean(),
})
