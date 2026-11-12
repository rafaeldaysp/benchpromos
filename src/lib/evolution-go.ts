import { env } from '@/env.mjs'

// Media sends make Evolution Go download the image before uploading it to
// WhatsApp; a reconnecting socket has been seen to take ~44s.
const REQUEST_TIMEOUT_MS = 60000

export type WhatsappConnectionState = 'open' | 'qr-code' | 'closed'

export type WhatsappMediaType = 'image' | 'video' | 'document'

export interface EvolutionGoConfig {
  apiUrl: string
  /** The instance's token: it both authenticates and selects the instance. */
  instanceToken: string
}

interface SendTextParams {
  number: string
  text: string
}

interface SendMediaParams {
  number: string
  media: string
  mediatype?: WhatsappMediaType
  caption?: string
  fileName?: string
}

interface EvolutionGoSendResult {
  message?: string
  data?: { Info?: { ID?: string } }
}

interface EvolutionGoStatusResult {
  data?: { Connected?: boolean; LoggedIn?: boolean }
}

/**
 * Error from the Evolution Go gateway. `retryable` follows the provider's
 * reality: 429 and 5xx are transient (a reconnecting socket surfaces as a
 * 500 / network timeout), other 4xx are permanent (bad number, bad media URL).
 */
export class EvolutionGoError extends Error {
  readonly status: number
  readonly retryable: boolean

  constructor(message: string, status: number) {
    super(message)
    this.name = 'EvolutionGoError'
    this.status = status
    this.retryable = status === 429 || status >= 500
  }
}

/**
 * Digits-only number (country code, no "+"). A group JID (120363...@g.us),
 * channel JID (...@newsletter) or any "@"-suffixed id is passed through untouched.
 */
export function toWhatsappNumber(value: string) {
  return value.includes('@') ? value : value.replace(/\D/g, '')
}

/** Evolution Go errors come back as `{ "error": "..." }`. */
function readErrorDetail(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: unknown }
    return typeof parsed.error === 'string' ? parsed.error : body
  } catch {
    return body
  }
}

/**
 * Thin Evolution Go wrapper. Config is injected — it never reads env on its own.
 * Channel (@newsletter) media works here, unlike the previous whatsmiau
 * gateway, which uploaded channel images encrypted and they rendered grey.
 */
export function createEvolutionGoClient(config: EvolutionGoConfig) {
  const apiUrl = config.apiUrl.replace(/\/$/, '')

  async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    let response: Response

    try {
      response = await fetch(`${apiUrl}${path}`, {
        method,
        headers: {
          apikey: config.instanceToken,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      // Network error or timeout — a dead instance can surface here too.
      throw new EvolutionGoError(
        error instanceof Error ? error.message : 'Falha de conexão.',
        503,
      )
    }

    if (!response.ok) {
      const detail = readErrorDetail(await response.text().catch(() => ''))

      throw new EvolutionGoError(
        detail || `Evolution Go respondeu ${response.status}.`,
        response.status,
      )
    }

    return (await response.json().catch(() => null)) as T
  }

  return {
    /** `open` only when the socket is up AND a device is paired. */
    async connectionState(): Promise<WhatsappConnectionState> {
      const result = await request<EvolutionGoStatusResult>(
        'GET',
        '/instance/status',
      )
      const status = result?.data

      if (status?.Connected && status.LoggedIn) return 'open'
      return status?.Connected ? 'qr-code' : 'closed'
    },

    sendText({ number, text }: SendTextParams) {
      return request<EvolutionGoSendResult>('POST', '/send/text', {
        number: toWhatsappNumber(number),
        text,
      })
    },

    sendMedia({
      number,
      media,
      mediatype = 'image',
      caption,
      fileName,
    }: SendMediaParams) {
      return request<EvolutionGoSendResult>('POST', '/send/media', {
        number: toWhatsappNumber(number),
        type: mediatype,
        url: media,
        ...(caption ? { caption } : {}),
        ...(fileName ? { filename: fileName } : {}),
      })
    },
  }
}

export interface EvolutionGoServerConfig extends EvolutionGoConfig {
  chatIds: string[]
}

/**
 * Resolves Evolution Go config from env. WHATSAPP_CHAT_IDS is a comma-separated
 * list of chats (group JIDs, channel JIDs or numbers); every post goes to all
 * of them. Returns null when the channel is not configured (missing
 * url/token/chats) so callers can stay dark.
 */
export function getEvolutionGoServerConfig(): EvolutionGoServerConfig | null {
  const chatIds = Array.from(
    new Set(
      (env.WHATSAPP_CHAT_IDS ?? '')
        .split(',')
        .map((chatId) => chatId.trim())
        .filter(Boolean),
    ),
  )

  if (
    !env.EVOLUTION_GO_URL ||
    !env.EVOLUTION_GO_INSTANCE_TOKEN ||
    !chatIds.length
  ) {
    return null
  }

  return {
    apiUrl: env.EVOLUTION_GO_URL,
    instanceToken: env.EVOLUTION_GO_INSTANCE_TOKEN,
    chatIds,
  }
}
