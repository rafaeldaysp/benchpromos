import type { TelegramMessageInput } from '@/lib/validations/telegram'
import { priceFormatter } from '@/utils/formatter'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatValue(value: string, html: boolean) {
  return html ? escapeHtml(value) : value
}

function formatPrice(priceInCents: number) {
  return priceFormatter.format(priceInCents / 100)
}

function formatPriceLine(
  priceInCents: number,
  label: string | undefined,
  html: boolean,
) {
  const price = formatValue(formatPrice(priceInCents), html)
  const suffix = label ? ` (${formatValue(label, html)})` : ''

  return `💸 ${price}${suffix}`
}

export function buildTelegramPostText(
  message: TelegramMessageInput,
  options: { html?: boolean } = {},
) {
  const html = options.html ?? false
  const lines: string[] = []
  const formattedPrice = formatValue(formatPrice(message.price), html)

  if (message.highlight) {
    lines.push(`⭐️ ${formatValue(message.highlight.toUpperCase(), html)}! ⭐️`)
    lines.push('')
  }

  if (message.callout) {
    lines.push(`🔸 ${formatValue(message.callout, html)}`)
    lines.push('')
  }

  lines.push(
    `🔥 ${formatValue(message.title, html)} - ${formattedPrice} 🔥${
      message.sponsored ? ' #anúncio' : ''
    }`,
  )

  if (message.caption) {
    lines.push('')
    lines.push(`🔴 ${formatValue(message.caption, html)} 🔴`)
  }

  lines.push('')

  if (message.coupon) {
    lines.push(`🎟 Cupom: ${formatValue(message.coupon, html)}`)
  }

  lines.push(formatPriceLine(message.price, message.couponDiscount, html))

  if (message.totalInstallmentPrice) {
    const installmentLabel = message.installments
      ? `Parcelado em ${message.installments}x`
      : 'Parcelado'

    lines.push(
      formatPriceLine(message.totalInstallmentPrice, installmentLabel, html),
    )
  }

  lines.push('')
  lines.push(`🔗 ${formatValue(message.url, html)}`)

  if (message.note) {
    lines.push('')
    lines.push(`🔸 ${formatValue(message.note, html)}`)
  }

  return lines.join('\n')
}

export function buildTelegramCaption(message: TelegramMessageInput) {
  return buildTelegramPostText(message, { html: true })
}
