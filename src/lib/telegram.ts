import type { TelegramMessageInput } from '@/lib/validations/telegram'
import { couponFormatter, priceFormatter } from '@/utils/formatter'

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

// Telegram caps sendPhoto captions at 1024 characters (counted on the parsed
// text). We truncate the plain text and escape afterwards, so a cut can never
// split an HTML entity.
const TELEGRAM_CAPTION_LIMIT = 1024

function truncateForTelegram(text: string) {
  if (text.length <= TELEGRAM_CAPTION_LIMIT) return text

  const limit = TELEGRAM_CAPTION_LIMIT - 1 // room for the ellipsis
  const slice = text.slice(0, limit)
  const lastBreak = slice.lastIndexOf('\n')
  // Prefer ending on a line break when one is reasonably close to the limit.
  const cut = lastBreak > limit - 300 ? slice.slice(0, lastBreak) : slice

  return `${cut.trimEnd()}…`
}

function formatPrice(priceInCents: number) {
  return priceFormatter.format(priceInCents / 100)
}

function parseNumberText(value: string) {
  const cleaned = value.replace(/[^\d,.-]/g, '')

  if (!cleaned) return null

  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/\.(?=\d{3}(\D|$))/g, '')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

function parseAbsoluteDiscountCents(value: string) {
  const parsed = parseNumberText(value)

  return parsed === null ? null : Math.round(parsed * 100)
}

function parsePercentDiscountCents(value: string, priceInCents: number) {
  const parsed = parseNumberText(value.replace('%', ''))

  return parsed === null ? null : Math.round(priceInCents * (parsed / 100))
}

function parseTelegramCouponDiscountPart(
  discount: string,
  priceInCents: number,
) {
  return discount.includes('%')
    ? parsePercentDiscountCents(discount, priceInCents)
    : parseAbsoluteDiscountCents(discount)
}

export function isTelegramCouponDiscountParseable(couponDiscount: string) {
  const discounts = couponDiscount
    .split('+')
    .map((discount) => discount.trim())
    .filter(Boolean)

  return (
    discounts.length > 0 &&
    discounts.every(
      (discount) => parseTelegramCouponDiscountPart(discount, 10000) !== null,
    )
  )
}

export function calculateTelegramCouponDiscountCents({
  price,
  couponDiscount,
  maxCouponDiscount,
}: Pick<
  TelegramMessageInput,
  'couponDiscount' | 'maxCouponDiscount' | 'price'
>) {
  if (!couponDiscount) return 0

  const discountInCents = couponDiscount
    .split('+')
    .map((discount) => discount.trim())
    .filter(Boolean)
    .reduce((total, discount) => {
      const parsedDiscount = parseTelegramCouponDiscountPart(discount, price)

      return total + (parsedDiscount ?? 0)
    }, 0)
  const cappedDiscount = maxCouponDiscount
    ? Math.min(discountInCents, maxCouponDiscount)
    : discountInCents

  return Math.max(0, Math.min(cappedDiscount, price))
}

export function getTelegramEffectivePrice(message: TelegramMessageInput) {
  if (!message.applyCouponDiscount) return message.price

  return (
    message.price -
    calculateTelegramCouponDiscountCents({
      couponDiscount: message.couponDiscount,
      maxCouponDiscount: message.maxCouponDiscount,
      price: message.price,
    })
  )
}

export function getTelegramEffectiveInstallmentPrice(
  message: TelegramMessageInput,
) {
  if (!message.totalInstallmentPrice) return undefined
  if (!message.applyCouponDiscount) return message.totalInstallmentPrice

  return (
    message.totalInstallmentPrice -
    calculateTelegramCouponDiscountCents({
      couponDiscount: message.couponDiscount,
      maxCouponDiscount: message.maxCouponDiscount,
      price: message.totalInstallmentPrice,
    })
  )
}

export function formatTelegramPrice(priceInCents: number) {
  return formatPrice(priceInCents)
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
  const effectivePrice = getTelegramEffectivePrice(message)
  const formattedPrice = formatValue(formatPrice(effectivePrice), html)
  const priceCondition =
    message.priceCondition ??
    (message.applyCouponDiscount && message.couponDiscount
      ? 'Com Cupom'
      : undefined)

  if (message.highlight) {
    lines.push(`⭐️ ${formatValue(message.highlight.toUpperCase(), html)}! ⭐️`)
    lines.push('')
  }

  if (message.callout) {
    lines.push(`🔸 ${formatValue(message.callout, html)}`)
    lines.push('')
  }

  // A zero price is omitted entirely (from the title and the 💸 line) so posts
  // like giveaways don't show a "R$ 0,00".
  const titlePrice = effectivePrice > 0 ? ` - ${formattedPrice}` : ''

  lines.push(
    `🔥 ${formatValue(message.title, html)}${titlePrice} 🔥${
      message.sponsored ? ' #anúncio' : ''
    }`,
  )

  if (message.caption) {
    lines.push('')
    lines.push(`🔴 ${formatValue(message.caption, html)} 🔴`)
  }

  const hasPriceBlock =
    effectivePrice > 0 || !!message.coupon || !!message.totalInstallmentPrice

  if (hasPriceBlock) {
    lines.push('')

    if (message.coupon) {
      lines.push(`🎟 Cupom: ${formatValue(message.coupon, html)}`)
    }

    if (effectivePrice > 0) {
      lines.push(formatPriceLine(effectivePrice, priceCondition, html))
    }

    if (message.totalInstallmentPrice) {
      const effectiveInstallmentPrice =
        getTelegramEffectiveInstallmentPrice(message) ??
        message.totalInstallmentPrice
      const installmentLabel = message.installments
        ? `Parcelado em ${message.installments}x`
        : 'Parcelado'

      lines.push(
        formatPriceLine(effectiveInstallmentPrice, installmentLabel, html),
      )
    }

    for (const { discount, label } of message.discounts ?? []) {
      const value = formatValue(couponFormatter(discount), html)
      const source = label ? ` em ${formatValue(label, html)}` : ''

      lines.push(`🏷 Já inclui ${value} de desconto${source}`)
    }
  }

  lines.push('')
  lines.push(`🔗 ${formatValue(message.url, html)}`)

  if (message.note) {
    lines.push('')
    lines.push(`🔸 ${formatValue(message.note, html)}`)
  }

  if (message.cashback) {
    lines.push('')
    lines.push(
      `🟢 Tem ${message.cashback.value}% de Cashback via ${formatValue(
        message.cashback.provider,
        html,
      )}, se você não utiliza, entra aqui > ${formatValue(
        message.cashback.affiliatedUrl,
        html,
      )} 🟢`,
    )
  }

  if (message.review) {
    lines.push('')
    lines.push(
      message.review
        .split('\n\n')
        .map((paragraph) => `🔸 ${formatValue(paragraph, html)}`)
        .join('\n\n'),
    )
  }

  return lines.join('\n')
}

/**
 * HTML caption for Telegram's sendPhoto, capped at the 1024-char limit. The
 * post text has no HTML tags, so we truncate the plain text and escape it —
 * equivalent to the per-field HTML escaping, but length-safe.
 */
export function buildTelegramCaption(message: TelegramMessageInput) {
  return escapeHtml(truncateForTelegram(buildTelegramPostText(message)))
}

/** Plain-text, length-capped caption used as a fallback when HTML is rejected. */
export function buildTelegramPlainCaption(message: TelegramMessageInput) {
  return truncateForTelegram(buildTelegramPostText(message))
}
