import * as z from 'zod'

export const retailerSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
})
