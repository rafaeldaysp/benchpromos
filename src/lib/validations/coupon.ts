import * as z from 'zod'

export const couponSchema = z.object({
  retailerId: z.string().min(1),
  code: z.string().min(1),
  discount: z.string().min(1),
  minimumSpend: z.coerce.number().int().optional(),
  description: z.string().optional(),
  availability: z.boolean(),
})
