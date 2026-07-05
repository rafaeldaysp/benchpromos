'use client'

import * as React from 'react'

import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  'discord-gerais': {
    label: 'Gerais',
    channel: 'Discord',
    endpoint: '/api/discord',
    payload: { target: 'gerais' },
    icon: Icons.Discord,
    requires: 'discord',
  },
  'discord-promocoes': {
    label: 'Promoções',
    channel: 'Discord',
    endpoint: '/api/discord',
    payload: { target: 'promocoes' },
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

export const DISCORD_DESTINATIONS = [
  'discord-gerais',
  'discord-promocoes',
] as const satisfies readonly Destination[]

/** True when at least one Discord channel is toggled on. */
export function isDiscordSelected(destinations: Record<Destination, boolean>) {
  return DISCORD_DESTINATIONS.some((destination) => destinations[destination])
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

interface DiscordRolesInputProps {
  value: string[]
  onChange: (roles: string[]) => void
}

/**
 * Chip input for Discord role marks. Type "@cargo" and press Enter to add;
 * the marks are prepended (as literal text) to the top of the Discord message.
 */
export function DiscordRolesInput({ value, onChange }: DiscordRolesInputProps) {
  const [input, setInput] = React.useState('')

  function addRole() {
    const trimmed = input.trim()

    if (!trimmed) return

    const role = trimmed.startsWith('@') ? trimmed : `@${trimmed}`

    if (!value.includes(role)) onChange([...value, role])

    setInput('')
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        Marcar cargos no Discord (opcional)
      </Label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((role) => (
            <Badge key={role} variant="secondary" className="gap-1">
              {role}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== role))}
                aria-label={`Remover ${role}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icons.X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            addRole()
          } else if (
            event.key === 'Backspace' &&
            input === '' &&
            value.length > 0
          ) {
            onChange(value.slice(0, -1))
          }
        }}
        placeholder="@cargo e Enter"
      />
    </div>
  )
}
