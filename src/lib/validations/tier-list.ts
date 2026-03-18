import * as z from 'zod'

export const tierListSchema = z
  .object({
    title: z.string().min(1, 'Campo obrigatório'),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) =>
      (data.categoryIds && data.categoryIds.length > 0) ||
      (data.categoryId && data.categoryId.length > 0),
    {
      message: 'Selecione ao menos uma categoria',
      path: ['categoryIds'],
    },
  )

export const tierSchema = z
  .object({
    name: z.string().min(1, 'Campo obrigatório'),
    color: z.string().min(1, 'Selecione uma cor'),
    noBudgetLimit: z.boolean(),
    priceLimit: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.noBudgetLimit) return true
      const value = Number(data.priceLimit)
      return !isNaN(value) && value >= 0
    },
    {
      message: 'Informe um valor válido',
      path: ['priceLimit'],
    },
  )
