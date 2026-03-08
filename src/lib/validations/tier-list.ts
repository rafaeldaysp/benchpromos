import * as z from 'zod'

export const tierListSchema = z.object({
  title: z.string().min(1, 'Campo obrigatório'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
})

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
