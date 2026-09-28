import { env } from '@/env.mjs'

const siteUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '')

export const links = [
  {
    title: 'YouTube',
    href: 'https://www.youtube.com/@lucasishii',
  },
  {
    title: 'Telegram',
    href: 'https://t.me/BenchPromos',
  },
  {
    title: 'Discord',
    href: 'https://discord.gg/cCD5PEjyjg',
  },
]

export const siteConfig = {
  name: 'Bench Promos',
  description:
    'Um portal de tecnologia completo destinado ao mapeamento de ofertas e preços de produtos, publicações de testes de benchmarks realizados por nossa equipe e muito mais!',
  url: siteUrl,
  ogImage: `${siteUrl}/opengraph-image.png`,
  mainNav: [
    {
      title: 'Notebooks',
      href: '/notebooks',
    },
    {
      title: 'Periféricos',
      items: [
        { title: 'Mouses', href: '/mouses' },
        { title: 'Teclados', href: '/teclados' },
        { title: 'Headsets', href: '/headsets' },
        { title: 'Microfones', href: '/microfones' },
        { title: 'Mousepads', href: '/mousepads' },
        { title: 'Controles', href: '/controles' },
      ],
    },
  ],
}
