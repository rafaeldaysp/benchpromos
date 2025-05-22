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
    emote: '🔥',
    label: 'Fogo',
  },
  {
    emote: '❤️',
    label: 'Coração',
  },
]

export const RESENT_EMAIL_TIME_MS = 10 * 60 * 1000 // 10 minutes

export const notebooksCustomFilters = [
  {
    label: 'Ocultar Frame Generation',
    slug: 'hide-frame-generation',
    values: ['Frame Generation'],
    type: 'hide',
  },
  {
    label: 'Ocultar Modo Turbo',
    slug: 'hide-modo-turbo',
    values: ['Modo Turbo'],
    type: 'hide',
  },
  {
    label: 'Mostrar Modo Equilibrado',
    slug: 'show-modo-equilibrado',
    values: ['Modo Desempenho', 'Modo Equilibrado', 'Modo Balanceado'],
    type: 'show',
  },
  {
    label: 'Mostrar Na Bateria',
    slug: 'show-on-battery',
    values: ['Na Bateria'],
    type: 'show',
  },
  {
    label: 'Mostrar Desktops',
    slug: 'show-desktops',
    values: ['Desktop', 'PC'],
    type: 'show',
  },
  {
    label: 'Mostrar descontinuados',
    slug: 'descontinued',
    values: ['Descontinuado'],
    type: 'show',
  },
]
