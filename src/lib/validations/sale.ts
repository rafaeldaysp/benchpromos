import { z } from 'zod'

export const saleSchema = z.object({
  title: z.string(),
  imageUrl: z.string(),
  comments: z.string().optional(),
  categoryId: z.string(),
})
