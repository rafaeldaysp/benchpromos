'use client'

import { Icons } from '@/components/icons'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { TelegramMessageInput } from '@/lib/validations/telegram'

// `requires` gates a destination behind a server-side capability flag.
// Destinations without it are always available.
export const DESTINATIONS = {
  'telegram-general': {
    label: 'Gerais',
    channel: 'Telegram',
    endpoint: '/api/telegram',
    payload: { target: 'general' },
    icon: Icons.Send,
  },
  'telegram-tech': {
    label: 'Tecnologia',
    channel: 'Telegram',
    endpoint: '/api/telegram',
    payload: { target: 'tech' },
    icon: Icons.Send,
  },
  whatsapp: {
    label: 'WhatsApp',
    channel: 'WhatsApp',
    endpoint: '/api/whatsapp',
    payload: {},
    icon: Icons.MessageCircle,
    requires: 'whatsapp',
  },
  discord: {
    label: 'Discord',
    channel: 'Discord',
    endpoint: '/api/discord',
    payload: {},
    icon: Icons.Discord,
    requires: 'discord',
  },
} as const

export type Destination = keyof typeof DESTINATIONS
export type Capability = 'whatsapp' | 'discord'

export function isDestinationAvailable(
  destination: Destination,
  capabilities: Record<Capability, boolean>,
) {
  const requires = (DESTINATIONS[destination] as { requires?: Capability })
    .requires

  return !requires || capabilities[requires]
}

async function getResponseMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    message?: string
  } | null

  return body?.message
}

export async function sendToDestination(
  destination: Destination,
  data: TelegramMessageInput,
  extraBody?: Record<string, unknown>,
) {
  const { label, endpoint, payload } = DESTINATIONS[destination]

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, ...payload, ...extraBody }),
  })

  const responseMessage = await getResponseMessage(response)

  if (!response.ok) {
    throw new Error(responseMessage ?? `Não foi possível enviar para ${label}.`)
  }

  return responseMessage ?? `Mensagem enviada para ${label}.`
}

interface DestinationTogglesProps {
  destinations: Record<Destination, boolean>
  capabilities: Record<Capability, boolean>
  onToggle: (destination: Destination, checked: boolean) => void
}

export function DestinationToggles({
  destinations,
  capabilities,
  onToggle,
}: DestinationTogglesProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(DESTINATIONS) as Destination[])
        .filter((destination) =>
          isDestinationAvailable(destination, capabilities),
        )
        .map((destination) => {
          const { label, channel, icon: Icon } = DESTINATIONS[destination]

          return (
            <div
              key={destination}
              className="flex h-9 items-center justify-between rounded-md border border-input px-3 shadow-sm"
            >
              <Label
                htmlFor={`destination-${destination}`}
                className="flex items-center gap-2 text-sm font-normal text-muted-foreground"
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>
                  {label}
                  {channel !== label && (
                    <span className="ml-1 text-xs text-muted-foreground/70">
                      {channel}
                    </span>
                  )}
                </span>
              </Label>
              <Switch
                id={`destination-${destination}`}
                checked={destinations[destination]}
                onCheckedChange={(checked) => onToggle(destination, checked)}
              />
            </div>
          )
        })}
    </div>
  )
}
