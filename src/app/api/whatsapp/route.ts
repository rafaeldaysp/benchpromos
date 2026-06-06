import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import { buildTelegramPostText } from '@/lib/telegram'
import { telegramMessageSchema } from '@/lib/validations/telegram'
import {
  WhatsmiauError,
  createWhatsmiauClient,
  getWhatsmiauServerConfig,
} from '@/lib/whatsmiau'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsedMessage = telegramMessageSchema.safeParse(body)

  if (!parsedMessage.success) {
    return NextResponse.json(
      { message: 'Revise os campos e tente novamente.' },
      { status: 400 },
    )
  }

  const config = getWhatsmiauServerConfig()

  if (!config) {
    return NextResponse.json(
      {
        message:
          'Configure WHATSMIAU_API_KEY, WHATSMIAU_INSTANCE e WHATSMIAU_DEFAULT_CHAT.',
      },
      { status: 500 },
    )
  }

  const client = createWhatsmiauClient(config)

  // Guard: never send to a disconnected instance — it hangs with an i/o
  // timeout. Check the connection first and fail fast and clearly.
  try {
    const state = await client.connectionState()

    if (state !== 'open') {
      return NextResponse.json(
        {
          message:
            'Instância do WhatsApp desconectada. Tente novamente em instantes.',
        },
        { status: 503 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Não foi possível verificar a conexão do WhatsApp.' },
      { status: error instanceof WhatsmiauError ? error.status : 502 },
    )
  }

  // The image is required by the schema, so every post is a media send with
  // the plain-text caption (same text rendered in the form preview).
  try {
    await client.sendMedia({
      number: config.defaultChat,
      media: parsedMessage.data.imageUrl,
      mediatype: 'image',
      caption: buildTelegramPostText(parsedMessage.data),
    })
  } catch (error) {
    if (error instanceof WhatsmiauError) {
      return NextResponse.json(
        {
          message: error.retryable
            ? 'WhatsApp indisponível no momento. Tente novamente.'
            : 'Não foi possível enviar para o WhatsApp. Verifique a imagem e o destino.',
        },
        { status: error.status },
      )
    }

    return NextResponse.json(
      { message: 'Não foi possível conectar ao WhatsApp.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ message: 'Mensagem enviada para o WhatsApp.' })
}
