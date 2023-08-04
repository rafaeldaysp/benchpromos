import * as z from 'zod'

export const retailerSchema = z.object({
  name: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório'),
})
