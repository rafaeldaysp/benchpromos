import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { env } from '@/env.mjs'
import { authOptions } from '@/lib/auth'
import { buildTelegramCaption, buildTelegramPlainCaption } from '@/lib/telegram'
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

  const target = body?.target === 'tech' ? 'tech' : 'general'
  const chatId =
    target === 'tech' ? env.TELEGRAM_TECH_CHAT_ID : env.TELEGRAM_CHAT_ID
  const targetLabel =
    target === 'tech' ? 'Ofertas de tecnologia' : 'Ofertas gerais'
  const chatIdEnvName =
    target === 'tech' ? 'TELEGRAM_TECH_CHAT_ID' : 'TELEGRAM_CHAT_ID'

  if (!env.TELEGRAM_BOT_TOKEN || !chatId) {
    return NextResponse.json(
      { message: `Configure TELEGRAM_BOT_TOKEN e ${chatIdEnvName}.` },
      { status: 500 },
    )
  }

  const message = parsedMessage.data
  const sendPhotoUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`

  async function sendPhoto(caption: string, parseMode?: 'HTML') {
    return fetch(sendPhotoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: message.imageUrl,
        caption,
        ...(parseMode ? { parse_mode: parseMode } : {}),
      }),
      cache: 'no-store',
    })
  }

  let telegramResponse: Response

  try {
    telegramResponse = await sendPhoto(buildTelegramCaption(message), 'HTML')
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao Telegram.' },
      { status: 502 },
    )
  }

  let telegramBody = await telegramResponse.json().catch(() => null)

  // If Telegram rejects the formatted caption (e.g. an entity parse error),
  // retry once as plain text (no parse_mode) so the post still goes out.
  if (!telegramResponse.ok || telegramBody?.ok === false) {
    try {
      telegramResponse = await sendPhoto(buildTelegramPlainCaption(message))
    } catch {
      return NextResponse.json(
        { message: 'Não foi possível conectar ao Telegram.' },
        { status: 502 },
      )
    }

    telegramBody = await telegramResponse.json().catch(() => null)
  }

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

  return NextResponse.json({
    message: `Enviado para ${targetLabel} (Telegram).`,
  })
}
