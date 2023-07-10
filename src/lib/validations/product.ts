import { z } from 'zod'

export const productSchema = z.object({
  title: z.string(),
  imageUrl: z.string(),
  specs: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ),
  reviewUrl: z.string().optional(),
  description: z.string().optional(),
  referencePrice: z.coerce.number().int().optional(),
  categoryId: z.string(),
  subcategoryId: z.string().optional(),
})
