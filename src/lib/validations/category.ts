import * as z from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1),
})

export const subcategorySchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
})
