import * as z from 'zod'

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const socialMediaLinkSchema = z.object({
  url: z
    .string()
    .min(1, 'Campo obrigatório')
    .url('Endereço inválido')
    .refine(isHttpUrl, 'Endereço inválido'),
  platform: z.enum(['WHATSAPP', 'TELEGRAM', 'DISCORD', 'YOUTUBE'], {
    required_error: 'Selecione uma plataforma',
  }),
  type: z.enum(['GENERAL_OFFERS', 'TECH_OFFERS', 'COMMUNICATION', 'CONTENT'], {
    required_error: 'Selecione um tipo',
  }),
  title: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().default(false),
})

export type SocialMediaLinkInput = z.infer<typeof socialMediaLinkSchema>
