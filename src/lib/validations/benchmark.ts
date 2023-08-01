import * as z from 'zod'

export const benchmarkSchema = z.object({
  name: z.string().min(3),
})

export const benchmarkResultSchema = z.object({
  benchmarkId: z.string(),
  result: z.coerce.number(),
  description: z.string().optional(),
})

export const benchmarkDataRowSchema = z.object({
  id: z.string(),
  result: z.number(),
  description: z.string().optional(),
  benchmark: z.object({
    id: z.string(),
    name: z.string(),
  }),
  product: z.object({
    id: z.string(),
  }),
})
