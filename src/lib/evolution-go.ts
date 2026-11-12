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

interface SendMediaFileParams {
  number: string
  file: Buffer
  mediatype?: WhatsappMediaType
  caption?: string
  fileName?: string
  mimeType?: string
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
      // FormData goes as-is so fetch sets the multipart boundary itself.
      const isForm = body instanceof FormData
      response = await fetch(`${apiUrl}${path}`, {
        method,
        headers: {
          apikey: config.instanceToken,
          ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        },
        body: isForm ? body : body ? JSON.stringify(body) : undefined,
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

    /** Uploads the image bytes directly (multipart) instead of a URL. */
    sendMediaFile({
      number,
      file,
      mediatype = 'image',
      caption,
      fileName = 'image.jpg',
      mimeType = 'image/jpeg',
    }: SendMediaFileParams) {
      const form = new FormData()
      form.append('number', toWhatsappNumber(number))
      form.append('type', mediatype)
      if (caption) form.append('caption', caption)
      form.append('filename', fileName)
      form.append(
        'file',
        new Blob([new Uint8Array(file)], { type: mimeType }),
        fileName,
      )

      return request<EvolutionGoSendResult>('POST', '/send/media', form)
    },
  }
}

export interface EvolutionGoServerConfig extends EvolutionGoConfig {
  chatIds: string[]
}

/**
 * Which chat list a post goes to. Mirrors the Telegram general/tech split:
 * the post page (telegram form) sends `general`, the sale page sends `tech`.
 */
export type WhatsappTarget = 'general' | 'tech'

export const WHATSAPP_CHAT_IDS_ENV_NAME: Record<WhatsappTarget, string> = {
  general: 'WHATSAPP_CHAT_IDS',
  tech: 'WHATSAPP_TECH_CHAT_IDS',
}

function parseChatIds(value: string | undefined) {
  return Array.from(
    new Set(
      (value ?? '')
        .split(',')
        .map((chatId) => chatId.trim())
        .filter(Boolean),
    ),
  )
}

/**
 * Resolves Evolution Go config from env for a target. WHATSAPP_CHAT_IDS
 * (general) and WHATSAPP_TECH_CHAT_IDS (tech) are comma-separated lists of
 * chats (group JIDs, channel JIDs or numbers); every post goes to all chats of
 * its target. Returns null when that target is not configured (missing
 * url/token/chats) so callers can stay dark.
 *
 * @example getEvolutionGoServerConfig('tech')?.chatIds
 */
export function getEvolutionGoServerConfig(
  target: WhatsappTarget = 'general',
): EvolutionGoServerConfig | null {
  const chatIds = parseChatIds(
    target === 'tech' ? env.WHATSAPP_TECH_CHAT_IDS : env.WHATSAPP_CHAT_IDS,
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
