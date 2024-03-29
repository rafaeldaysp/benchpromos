import * as z from 'zod'

export const authSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome deve possuir no mínimo 3 caracteres')
    .max(30, 'O nome deve posuir no máximo 30 caracteres'),
  email: z.string().email({
    message: 'Por favor, insira um endereço de e-mail válido',
  }),
  password: z
    .string()
    .min(8, {
      message: 'A senha deve ter pelo menos 8 caracteres',
    })
    .max(100),
  // .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
  //   message:
  //     'A senha deve conter pelo menos 8 caracteres, um maiúsculo, um minúsculo, um número e um caractere especial',
  // }),
})

export const checkEmailSchema = z.object({
  email: authSchema.shape.email,
})

export const resetPasswordSchema = z
  .object({
    password: authSchema.shape.password,
    confirmPassword: authSchema.shape.password,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
