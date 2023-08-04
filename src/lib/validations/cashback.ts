import * as z from 'zod'

export const cashbackSchema = z.object({
  retailerId: z
    .string({ required_error: 'Selecione um varejista' })
    .min(1, 'Varejista inválido'),
  provider: z.string().min(1, 'Provedor inválido'),
  value: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Número inválido'),
  url: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório')
    .url('Endereço do cashback inválido'),
  affiliatedUrl: z
    .string({ required_error: 'Campo obrigatório' })
    .min(1, 'Campo obrigatório')
    .url('Endereço de afiliado inválido'),
})
