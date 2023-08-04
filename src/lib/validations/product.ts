import * as z from 'zod'

export const productSchema = z.object({
  name: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório'),
  imageUrl: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório')
    .url('Endereço da imagem inválido'),
  categoryId: z
    .string({ required_error: 'Selecione uma categoria' })
    .min(1, 'Categoria inválida'),
  specs: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
    }),
  ),
  reviewUrl: z.string().optional(),
  description: z.string().optional(),
  referencePrice: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Preço inválido')
    .optional(),
  subcategoryId: z.string().optional(),
})

export const linkFiltersSchema = z.object({
  filters: z.array(
    z.object({
      id: z.string(),
      optionId: z.string(),
    }),
  ),
})
