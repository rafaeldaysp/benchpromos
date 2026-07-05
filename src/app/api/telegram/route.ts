import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { env } from '@/env.mjs'
import { authOptions } from '@/lib/auth'
import { buildTelegramPlainCaption } from '@/lib/telegram'
import { telegramMessageSchema } from '@/lib/validations/telegram'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)

  console.log('[api/telegram] incoming body', body)

  const parsedMessage = telegramMessageSchema.safeParse(body)

  if (!parsedMessage.success) {
    const fieldErrors = parsedMessage.error.flatten().fieldErrors

    console.error('[api/telegram] validation failed', {
      body,
      fieldErrors,
    })

    const invalidFields = Object.keys(fieldErrors)

    return NextResponse.json(
      {
        message:
          invalidFields.length > 0
            ? `Campos inválidos: ${invalidFields.join(', ')}.`
            : 'Revise os campos e tente novamente.',
        fieldErrors,
      },
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
  const caption = buildTelegramPlainCaption(message)
  const sendPhotoUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`

  // Mirrors the backend sendTelegramPhoto: same body shape, Markdown parse
  // mode, and full response logged. `parseMode` is dropped on the retry.
  async function sendPhoto(parseMode?: 'Markdown') {
    const payload = {
      photo: message.imageUrl,
      caption,
      chat_id: chatId,
      ...(parseMode ? { parse_mode: parseMode } : {}),
    }

    console.log('[api/telegram] sendPhoto request', { target, ...payload })

    const response = await fetch(sendPhotoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const responseBody = await response.json().catch(() => null)

    console.log('[api/telegram] sendPhoto response', {
      target,
      status: response.status,
      ok: response.ok,
      body: responseBody,
    })

    return { response, body: responseBody }
  }

  let result

  try {
    result = await sendPhoto('Markdown')
  } catch (error) {
    console.error('[api/telegram] fetch failed', error)

    return NextResponse.json(
      { message: 'Não foi possível conectar ao Telegram.' },
      { status: 502 },
    )
  }

  // If Telegram rejects the Markdown (e.g. an unbalanced entity), retry once
  // as plain text with no parse_mode so the post still goes out.
  if (!result.response.ok || result.body?.ok === false) {
    console.warn(
      '[api/telegram] Markdown send rejected, retrying as plain text:',
      result.body?.description,
    )

    try {
      result = await sendPhoto()
    } catch (error) {
      console.error('[api/telegram] fetch failed', error)

      return NextResponse.json(
        { message: 'Não foi possível conectar ao Telegram.' },
        { status: 502 },
      )
    }
  }

  if (!result.response.ok || result.body?.ok === false) {
    return NextResponse.json(
      {
        message:
          result.body?.description ??
          'Não foi possível enviar a mensagem para o Telegram.',
      },
      { status: result.response.status || 502 },
    )
  }

  return NextResponse.json({
    message: `Enviado para ${targetLabel} (Telegram).`,
  })
}
