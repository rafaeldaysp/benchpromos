import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { env } from '@/env.mjs'
import { authOptions } from '@/lib/auth'
import { buildTelegramPostText } from '@/lib/telegram'
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

  const target = body?.target === 'gerais' ? 'gerais' : 'promocoes'
  const webhookBase =
    target === 'gerais'
      ? env.DISCORD_GERAIS_WEBHOOK_URL
      : env.DISCORD_PROMOCOES_WEBHOOK_URL
  const webhookEnvName =
    target === 'gerais'
      ? 'DISCORD_GERAIS_WEBHOOK_URL'
      : 'DISCORD_PROMOCOES_WEBHOOK_URL'

  if (!webhookBase) {
    return NextResponse.json(
      { message: `Configure ${webhookEnvName}.` },
      { status: 500 },
    )
  }

  const message = parsedMessage.data

  // Role marks are literal text prepended to the top of the message. Only
  // @everyone / @here actually ping (Discord parses them by default); named
  // roles render as text.
  const roleMarks = Array.isArray(body?.discordRoles)
    ? (body.discordRoles as unknown[]).filter(
        (role): role is string =>
          typeof role === 'string' && role.trim() !== '',
      )
    : []
  const rolePrefix = roleMarks.length > 0 ? `${roleMarks.join(' ')}\n\n` : ''

  // `wait=true` makes Discord validate and return the created message, so we
  // get a real status code instead of a fire-and-forget 204.
  const webhookUrl = `${webhookBase}?wait=true`

  async function postToDiscord(body: Record<string, unknown>) {
    let response: Response

    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      })
    } catch {
      return NextResponse.json(
        { message: 'Não foi possível conectar ao Discord.' },
        { status: 502 },
      )
    }

    if (!response.ok) {
      const discordBody = await response.json().catch(() => null)

      return NextResponse.json(
        {
          message:
            discordBody?.message ??
            'Não foi possível enviar a mensagem para o Discord.',
        },
        { status: response.status || 502 },
      )
    }

    return null
  }

  // When requested (Telegram dashboard), post the image as its own message
  // first, then the text. Otherwise a single message whose product URL renders
  // the preview.
  if (body?.discordImageFirst && message.imageUrl) {
    const imageError = await postToDiscord({
      embeds: [{ image: { url: message.imageUrl } }],
    })

    if (imageError) return imageError
  }

  const textError = await postToDiscord({
    // Plain message: the same formatted post used on the other channels, with
    // any role marks at the very top.
    content: `${rolePrefix}${buildTelegramPostText(message)}`,
  })

  if (textError) return textError

  return NextResponse.json({ message: `Enviado para o Discord (#${target}).` })
}
