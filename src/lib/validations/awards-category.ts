import * as z from 'zod'

export const awardsCategorySchema = z.object({
  title: z.string().min(1, 'Campo obrigatório'),
  shortTitle: z.string().optional(),
  icon: z.string().optional(),
  expiredAt: z.any(),
  awardsId: z.string().optional(),
  description: z.string().optional(),
})
