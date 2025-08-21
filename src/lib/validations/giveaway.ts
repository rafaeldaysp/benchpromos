import * as z from 'zod'

export const giveawaySchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
  description: z.string().min(1, 'Campo obrigatório'),
  drawAt: z.any(),
  status: z.enum(['OPEN', 'CLOSED']),
})
