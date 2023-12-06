import * as z from 'zod'

export const filterSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
  applyToBenchmarks: z.boolean().default(false),
})
