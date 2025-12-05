import * as z from 'zod'

export const giveawayRuleSchema = z.object({
  type: z.string().min(1, 'Campo obrigatório'),
  config: z.record(z.any()).optional().default({}),
})

export const giveawaySchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
  description: z.string().min(1, 'Campo obrigatório'),
  drawAt: z.any(),
  status: z.enum(['OPEN', 'CLOSED']),
  rules: z.array(giveawayRuleSchema).optional().default([]),
  imageUrl: z.string().optional(),
})
