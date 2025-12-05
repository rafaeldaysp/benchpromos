import * as z from 'zod'

export const awardsSchema = z
  .object({
    year: z.number().min(2020, 'Ano deve ser 2020 ou posterior'),
    isActive: z.boolean().default(false),
    showResults: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // If showResults is true, isActive must be false
      if (data.showResults) {
        return !data.isActive
      }
      return true
    },
    {
      message: 'Não é possível mostrar resultados com prêmios ativos',
      path: ['showResults'],
    },
  )
