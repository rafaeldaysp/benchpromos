import * as z from 'zod'

export const saleSchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().min(1),
  categoryId: z.string().min(1),
  price: z.coerce.number(),
  url: z.string().min(1),
  installments: z.coerce.number().int().optional(),
  totalInstallmentPrice: z.coerce.number().int().optional(),
  caption: z.string().optional(),
  review: z.string().optional(),
  label: z.string().optional(),
  coupon: z.string().optional(),
  cashback: z.string().optional(),
  productSlug: z.string().optional(),
})
