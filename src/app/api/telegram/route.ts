import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { env } from '@/env.mjs'
import { authOptions } from '@/lib/auth'
import { buildTelegramCaption } from '@/lib/telegram'
import { telegramMessageSchema } from '@/lib/validations/telegram'

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

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return NextResponse.json(
      { message: 'Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID.' },
      { status: 500 },
    )
  }

  let telegramResponse: Response

  try {
    telegramResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          photo: parsedMessage.data.imageUrl,
          caption: buildTelegramCaption(parsedMessage.data),
          parse_mode: 'HTML',
        }),
        cache: 'no-store',
      },
    )
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao Telegram.' },
      { status: 502 },
    )
  }

  const telegramBody = await telegramResponse.json().catch(() => null)

  if (!telegramResponse.ok || telegramBody?.ok === false) {
    return NextResponse.json(
      {
        message:
          telegramBody?.description ??
          'Não foi possível enviar a mensagem para o Telegram.',
      },
      { status: telegramResponse.status || 502 },
    )
  }

  return NextResponse.json({ message: 'Mensagem enviada com sucesso.' })
}
