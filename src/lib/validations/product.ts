import * as z from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
  imageUrl: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço da imagem inválido'),
  categoryId: z.string({ required_error: 'Selecione uma categoria' }),
  specs: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
    }),
  ),
  pros: z.array(
    z.object({
      value: z.string(),
    }),
  ),
  cons: z.array(
    z.object({
      value: z.string(),
    }),
  ),
  reviewUrl: z.string().optional(),
  referencePrice: z.coerce.number().int().optional(),
  subcategoryId: z.string().optional(),
})

export const filtersLinkSchema = z.object({
  filters: z.array(
    z.object({
      id: z.string(),
      optionId: z.string(),
    }),
  ),
})
