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
    label: 'Mostrar Frame Generation',
    slug: 'show-frame-generation',
    values: ['Frame Generation'],
    type: 'show',
  },
  {
    label: 'Mostrar Modo Turbo',
    slug: 'show-modo-turbo',
    values: ['Modo Turbo'],
    type: 'show',
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
  {
    label: 'Mostrar importados',
    slug: 'imported',
    values: ['Descontinuado'],
    type: 'show',
  },
]

export const MIN_SALES_DT = new Date().getTime() - 30 * 24 * 60 * 60 * 1000
