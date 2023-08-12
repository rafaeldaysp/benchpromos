import * as z from 'zod'

export const cashbackSchema = z.object({
  retailerId: z.string().nonempty({ message: 'Selecione um varejista' }),
  provider: z.string().min(1, 'Campo obrigatório'),
  value: z.coerce.number({ required_error: 'Campo obrigatório' }).int(),
  url: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço do cashback inválido'),
  affiliatedUrl: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço de afiliado inválido'),
})
