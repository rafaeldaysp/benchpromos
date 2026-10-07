import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'
import {
  WHATSAPP_CAPTION_LIMIT,
  buildTelegramPostText,
  truncateForChannel,
} from '@/lib/telegram'
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
          'Configure WHATSMIAU_API_KEY, WHATSMIAU_INSTANCE e WHATSMIAU_CHAT_IDS.',
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
  // the plain-text caption (same text rendered in the form preview). Every
  // configured chat gets the post; one failing chat never blocks the others.
  const caption = truncateForChannel(
    buildTelegramPostText(parsedMessage.data),
    WHATSAPP_CAPTION_LIMIT,
  )
  const results = await Promise.allSettled(
    config.chatIds.map((chatId) =>
      client.sendMedia({
        number: chatId,
        media: parsedMessage.data.imageUrl,
        mediatype: 'image',
        caption,
      }),
    ),
  )
  const errors = results.flatMap((result) =>
    result.status === 'rejected' ? [result.reason as unknown] : [],
  )

  if (!errors.length) {
    return NextResponse.json({
      message:
        config.chatIds.length === 1
          ? 'Mensagem enviada para o WhatsApp.'
          : `Mensagem enviada para ${config.chatIds.length} grupos do WhatsApp.`,
    })
  }

  const failedChats = config.chatIds.filter(
    (_, index) => results[index].status === 'rejected',
  )
  console.error('whatsmiau send failed', { failedChats, errors })

  const [error] = errors
  const status = error instanceof WhatsmiauError ? error.status : 502

  // Partial failure: say so explicitly — retrying the whole post would
  // duplicate it in the chats that already received it.
  if (errors.length < config.chatIds.length) {
    return NextResponse.json(
      {
        message: `Enviado para ${
          config.chatIds.length - errors.length
        } de ${config.chatIds.length} grupos do WhatsApp. Falhou em: ${failedChats.join(', ')}.`,
      },
      { status },
    )
  }

  if (error instanceof WhatsmiauError) {
    return NextResponse.json(
      {
        message: error.retryable
          ? 'WhatsApp indisponível no momento. Tente novamente.'
          : 'Não foi possível enviar para o WhatsApp. Verifique a imagem e o destino.',
      },
      { status },
    )
  }

  return NextResponse.json(
    { message: 'Não foi possível conectar ao WhatsApp.' },
    { status },
  )
}
