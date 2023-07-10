import { z } from 'zod'

export const cashbackSchema = z.object({
  retailerId: z.string(),
  provider: z.string(),
  percentValue: z.coerce.number().int(),
  url: z.string(),
  affiliatedUrl: z.string(),
})
