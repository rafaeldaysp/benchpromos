import * as z from 'zod'

export const couponSchema = z.object({
  retailerId: z.string({ required_error: 'Selecione um varejista' }),
  code: z.string().min(1, 'Campo obrigatório'),
  discount: z.string().min(1, 'Campo obrigatório'),
  minimumSpend: z.coerce.number().int().optional(),
  // Cap on the coupon discount, in cents. null clears an existing cap.
  maximumDiscount: z.number().int().positive().nullable().optional(),
  description: z.string().optional(),
  availability: z.boolean().default(true),
})
