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
    label: 'Somente Na Bateria',
    slug: 'only-on-battery',
    values: ['Na Bateria'],
    type: 'only',
  },
  {
    label: 'Mostrar Desktops',
    slug: 'show-desktops',
    values: ['Desktop', 'PC'],
    type: 'show',
  },
  {
    label: 'Ocultar Descontinuados',
    slug: 'descontinued',
    values: ['Descontinuado'],
    type: 'hide',
  },
  {
    label: 'Mostrar Importados',
    slug: 'imported',
    values: ['Importado'],
    type: 'show',
  },
]

export const MIN_SALES_DT = new Date().getTime() - 30 * 24 * 60 * 60 * 1000
