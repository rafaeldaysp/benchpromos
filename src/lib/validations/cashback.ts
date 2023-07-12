import * as z from 'zod'

export const cashbackSchema = z.object({
  retailerId: z.string().min(1),
  provider: z.string().min(1),
  percentValue: z.coerce.number().int(),
  url: z.string().min(1),
  affiliatedUrl: z.string().min(1),
})
