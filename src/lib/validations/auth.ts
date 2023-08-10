import * as z from 'zod'

export const authSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome de usuário deve possuir, no mínimo 1, caracter.')
    .max(30, 'O nome de usuário deve posuir, no máximo, 30 caracteres.'),
  email: z.string().email({
    message: 'Por favor, insira um endereço de e-mail válido',
  }),
  password: z
    .string()
    .min(8, {
      message: 'A senha deve ter pelo menos 8 caracteres',
    })
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
      message:
        'A senha deve conter pelo menos 8 caracteres, um maiúsculo, um minúsculo, um número e um caractere especial',
    }),
})

export const verfifyEmailSchema = z.object({
  code: z
    .string()
    .min(6, {
      message: 'O código de verificação deve ter 6 caracteres',
    })
    .max(6),
})

export const checkEmailSchema = z.object({
  email: authSchema.shape.email,
})

export const resetPasswordSchema = z
  .object({
    password: authSchema.shape.password,
    confirmPassword: authSchema.shape.password,
    code: verfifyEmailSchema.shape.code,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
