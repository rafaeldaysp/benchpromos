import * as z from 'zod'

export const benchmarkSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
})

export const benchmarkResultSchema = z.object({
  benchmarkId: z.string({ required_error: 'Selecione um benchmark' }),
  result: z.coerce.number({ required_error: 'Campo obrigatório' }).int(),
  productDisplayName: z.string(),
  description: z.string().optional(),
})

export const benchmarkDataRowSchema = z.object({
  id: z.string(),
  result: z.number(),
  productDisplayName: z.string(),
  description: z.string().optional(),
  benchmark: z.object({
    id: z.string(),
    name: z.string(),
  }),
  product: z.object({
    id: z.string(),
    name: z.string(),
  }),
})
