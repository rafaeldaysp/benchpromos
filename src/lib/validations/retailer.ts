import { z } from 'zod'

export const retailerSchema = z.object({
  name: z.string(),
})
