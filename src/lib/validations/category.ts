import * as z from 'zod'

export const categorySchema = z.object({
  name: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório'),
})

export const subcategorySchema = z.object({
  name: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório'),
  categoryId: z
    .string({ required_error: 'Selecione uma categoria' })
    .min(1, 'Categoria inválida'),
})
