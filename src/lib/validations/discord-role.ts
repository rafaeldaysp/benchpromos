import * as z from 'zod'

export const discordRoleSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório').trim(),
  value: z.string().min(1, 'Campo obrigatório').trim(),
})
