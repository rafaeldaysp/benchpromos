import * as z from 'zod'

export const couponSchema = z.object({
  retailerId: z
    .string({ required_error: 'Selecione um varejista' })
    .min(1, 'Varejista inválido'),
  code: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório'),
  discount: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório'),
  minimumSpend: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Número inválido')
    .optional(),
  description: z.string().optional(),
  availability: z.boolean(),
})
