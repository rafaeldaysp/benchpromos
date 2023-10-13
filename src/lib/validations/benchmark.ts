import * as z from 'zod'

export const benchmarkSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
  parentId: z.string(),
})

export const benchmarkResultSchema = z.object({
  benchmarkId: z.string({ required_error: 'Selecione um benchmark' }),
  result: z.coerce.number({ required_error: 'Campo obrigatório' }).int(),
  productAlias: z.string(),
  description: z.string().optional(),
  unit: z.string(),
})

export const benchmarkDataRowSchema = z.object({
  id: z.string(),
  result: z.number(),
  description: z.string().nullable(),
  benchmark: z.object({
    id: z.string(),
    name: z.string(),
  }),
  product: z.object({
    alias: z.string(),
    imageUrl: z.string(),
  }),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      imageUrl: z.string(),
    }),
  ),
})
