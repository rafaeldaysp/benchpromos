import * as z from 'zod'

export const productSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().min(1),
  categoryId: z.string().min(1),
  specs: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
    }),
  ),
  reviewUrl: z.string().optional(),
  description: z.string().optional(),
  referencePrice: z.coerce.number().int().optional(),
  subcategoryId: z.string().optional(),
})
