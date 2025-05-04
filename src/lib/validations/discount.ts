import * as z from 'zod'

export const discountSchema = z.object({
  retailerId: z.string({ required_error: 'Selecione um varejista' }),
  discount: z.string().min(1, 'Campo obrigatório'),
  description: z.string().optional(),
  label: z.string().optional(),
})
