import * as z from 'zod'

export const couponSchema = z.object({
  retailerId: z.string().nonempty({ message: 'Selecione um varejista' }),
  code: z.string().min(1, 'Campo obrigatório'),
  discount: z.string().min(1, 'Campo obrigatório'),
  minimumSpend: z.coerce.number().int().optional(),
  description: z.string().optional(),
  availability: z.boolean().default(true),
})
