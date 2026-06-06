import { env } from '@/env.mjs'

const REQUEST_TIMEOUT_MS = 15000

export type WhatsmiauConnectionState =
  | 'open'
  | 'closed'
  | 'connecting'
  | 'qr-code'

export type WhatsmiauMediaType = 'image' | 'video' | 'document'

export interface WhatsmiauConfig {
  apiUrl: string
  apiKey: string
  instance: string
}

interface SendTextParams {
  number: string
  text: string
}

interface SendMediaParams {
  number: string
  media: string
  mediatype?: WhatsmiauMediaType
  caption?: string
  fileName?: string
}

interface WhatsmiauSendResult {
  success?: boolean
  key?: { id?: string; remoteJid?: string }
}

/**
 * Error from the whatsmiau gateway. `retryable` follows the provider's
 * reality: 429 and 5xx are transient (a disconnected instance surfaces as a
 * 5xx / network timeout), other 4xx are permanent (bad number, bad media URL).
 */
export class WhatsmiauError extends Error {
  readonly status: number
  readonly retryable: boolean

  constructor(message: string, status: number) {
    super(message)
    this.name = 'WhatsmiauError'
    this.status = status
    this.retryable = status === 429 || status >= 500
  }
}

/**
 * Digits-only number for whatsmiau (country code, no "+"). A group JID
 * (120363...@g.us) or any "@"-suffixed id is passed through untouched.
 */
export function toWhatsmiauNumber(value: string) {
  return value.includes('@') ? value : value.replace(/\D/g, '')
}

/**
 * Thin whatsmiau wrapper. Config is injected — it never reads env on its own.
 */
export function createWhatsmiauClient(config: WhatsmiauConfig) {
  async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    let response: Response

    try {
      response = await fetch(`${config.apiUrl}${path}`, {
        method,
        headers: {
          apikey: config.apiKey,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      // Network error or timeout — a dead instance can surface here too.
      throw new WhatsmiauError(
        error instanceof Error ? error.message : 'Falha de conexão.',
        503,
      )
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '')

      throw new WhatsmiauError(
        detail || `whatsmiau respondeu ${response.status}.`,
        response.status,
      )
    }

    return (await response.json().catch(() => null)) as T
  }

  return {
    async connectionState() {
      const data = await request<{ state?: WhatsmiauConnectionState }>(
        'GET',
        `/instance/connectionState/${config.instance}`,
      )

      return data?.state
    },

    sendText({ number, text }: SendTextParams) {
      return request<WhatsmiauSendResult>(
        'POST',
        `/message/sendText/${config.instance}`,
        { number: toWhatsmiauNumber(number), text },
      )
    },

    sendMedia({
      number,
      media,
      mediatype = 'image',
      caption,
      fileName,
    }: SendMediaParams) {
      return request<WhatsmiauSendResult>(
        'POST',
        `/message/sendMedia/${config.instance}`,
        {
          number: toWhatsmiauNumber(number),
          mediatype,
          media,
          ...(caption ? { caption } : {}),
          ...(fileName ? { fileName } : {}),
        },
      )
    },
  }
}

export interface WhatsmiauServerConfig extends WhatsmiauConfig {
  defaultChat: string
}

/**
 * Resolves whatsmiau config from env. Returns null when the channel is not
 * configured (missing key/instance/default chat) so callers can stay dark.
 */
export function getWhatsmiauServerConfig(): WhatsmiauServerConfig | null {
  if (
    !env.WHATSMIAU_API_KEY ||
    !env.WHATSMIAU_INSTANCE ||
    !env.WHATSMIAU_DEFAULT_CHAT
  ) {
    return null
  }

  return {
    apiUrl: env.WHATSMIAU_API_URL,
    apiKey: env.WHATSMIAU_API_KEY,
    instance: env.WHATSMIAU_INSTANCE,
    defaultChat: env.WHATSMIAU_DEFAULT_CHAT,
  }
}
