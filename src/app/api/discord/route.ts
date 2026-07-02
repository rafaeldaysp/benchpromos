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

  if (!env.DISCORD_WEBHOOK_URL) {
    return NextResponse.json(
      { message: 'Configure DISCORD_WEBHOOK_URL.' },
      { status: 500 },
    )
  }

  const message = parsedMessage.data

  let discordResponse: Response

  try {
    // `wait=true` makes Discord validate and return the created message, so we
    // get a real status code instead of a fire-and-forget 204.
    discordResponse = await fetch(`${env.DISCORD_WEBHOOK_URL}?wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Plain message: the same formatted post used on the other channels.
        // The product URL already renders a preview (with image), so we don't
        // send the image separately.
        content: buildTelegramPostText(message),
      }),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao Discord.' },
      { status: 502 },
    )
  }

  if (!discordResponse.ok) {
    const discordBody = await discordResponse.json().catch(() => null)

    return NextResponse.json(
      {
        message:
          discordBody?.message ??
          'Não foi possível enviar a mensagem para o Discord.',
      },
      { status: discordResponse.status || 502 },
    )
  }

  return NextResponse.json({ message: 'Enviado para o Discord.' })
}
