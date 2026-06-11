import * as z from 'zod'

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const whatsappGroupSchema = z.object({
  url: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço do grupo inválido')
    .refine(isHttpUrl, 'Endereço do grupo inválido'),
  active: z.boolean().default(false),
})

export type WhatsappGroupInput = z.infer<typeof whatsappGroupSchema>
