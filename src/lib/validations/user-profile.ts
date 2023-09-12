import * as z from 'zod'

export const userProfileSchema = z.object({
  name: z
    .string({ required_error: 'Campo obrigatório.' })
    .min(3, {
      message: 'Seu nome deve possuir no mínimo 3 caracteres.',
    })
    .max(30, {
      message: 'Seu nome deve possuir no máximo 30 caracteres.',
    }),
  image: z.string().optional(),
})
