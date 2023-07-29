import * as z from 'zod'

export const benchmarkSchema = z.object({
  id: z.string(),
  product: z.object({
    id: z.string(),
  }),
  benchmark: z.object({
    id: z.string(),
    name: z.string(),
  }),
  description: z.string().nullable(),
  result: z.number(),
})

export const benchmarkValidator = z.object({
  name: z.string().min(3),
})

export const benchmarkResultValidator = z.object({
  benchmarkId: z.string(),
  productId: z.string(),
  result: z.number(),
  description: z.string().optional(),
})
