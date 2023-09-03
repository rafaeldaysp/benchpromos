import { type headerOption } from '@/types'

export const emotes = [
  {
    emote: '👍',
    label: 'Curtida',
  },
  {
    emote: '👎',
    label: 'Descurtida',
  },
  {
    emote: '💩',
    label: 'Cocô',
  },
  {
    emote: '🔥',
    label: 'Fogo',
  },
  {
    emote: '❤️',
    label: 'Coração',
  },
]

export const RESENT_EMAIL_TIME_MS = 10 * 60 * 1000 // 10 minutes

export const externalLinkOptions: headerOption[] = [
  {
    title: 'YouTube',
    slug: 'https://www.youtube.com/@lucasishii',
  },
  {
    title: 'Telegram',
    slug: 'https://t.me/BenchPromos',
  },
  {
    title: 'Discord',
    slug: 'https://discord.gg/cCD5PEjyjg',
  },
]
