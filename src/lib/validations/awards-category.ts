import * as z from 'zod'

export const awardsCategorySchema = z.object({
  title: z.string().min(1, 'Campo obrigatório'),
  expiredAt: z.any(),
  // description: z.string().optional(),
  // productOptions: z.array(
  //   z.object({
  //     title: z.string().min(1, 'Campo obrigatório'),
  //     productId: z.string().min(1, 'Campo obrigatório'),
  //   }),
  // ),
})
