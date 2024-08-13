import * as z from 'zod'

export const recommendationCategorySchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
})
