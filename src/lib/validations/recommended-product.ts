import * as z from 'zod'

export const recommendedProductSchema = z.object({
  minPrice: z.coerce
    .number({ required_error: 'Campo obrigatório' })
    .int()
    .gt(0),
  maxPrice: z.coerce
    .number({ required_error: 'Campo obrigatório' })
    .int()
    .gt(0),
  categoryId: z.string({ required_error: 'Selecione uma categoria' }),
})
