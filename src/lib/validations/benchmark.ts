import * as z from 'zod'

export const benchmarkSchema = z.object({
  id: z.string(),
  product: z.object({
    id: z.string(),
  }),
  benchmark: z.object({
    id: z.string(),
  }),
  description: z.string().nullable(),
  result: z.number(),
})
