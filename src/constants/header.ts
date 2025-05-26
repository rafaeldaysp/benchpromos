import { Icons } from '@/components/icons'
import { type Category, type headerOption } from '@/types'

interface HeaderOptionsProps {
  categories: Pick<Category, 'name' | 'slug'>[]
}

export function headerOptions({ categories }: HeaderOptionsProps) {
  const options: headerOption[] = [
    {
      title: 'Laptops',
      slug: 'laptops',
      icon: Icons.Laptop,
    },
    // {
    //   title: 'Peripherals',
    //   icon: Icons.Headphones,
    //   content: [
    //     { title: 'Mouses', slug: 'mouses' },
    //     { title: 'Keyboards', slug: 'keyboards' },
    //     { title: 'Headsets', slug: 'headsets' },
    //     { title: 'Microphones', slug: 'microphones' },
    //     { title: 'Mousepads', slug: 'mousepads' },
    //     { title: 'Joysticks', slug: 'joysticks' },
    //   ],
    // },
    // {
    //   title: 'Desktop',
    //   icon: Icons.PcCase,
    //   content: [
    //     { title: 'Computadores', slug: 'computadores' },
    //     { title: 'Placas de vídeo', slug: 'placas-de-video' },
    //     { title: 'Processadores', slug: 'processadores' },
    //     { title: 'Motherboards', slug: 'motherboards' },
    //     { title: 'Gabinetes', slug: 'gabinetes' },
    //     { title: 'Fontes', slug: 'fontes' },
    //   ],
    // },
  ]
  const usedCategoriesSlug: string[] = options.flatMap(
    (option) => option.content?.map((item) => item.slug) ?? [option.slug!],
  )

  const othersCategories = categories.filter(
    (category) => !usedCategoriesSlug.includes(category.slug),
  )

  const more = {
    title: 'More',
    icon: Icons.AlignLeft,
    content: othersCategories
      .map((category) => {
        return {
          title: category.name,
          slug: category.slug,
        }
      })
      .filter((item) => typeof item !== 'undefined'),
  }

  if (more.content.length > 0) options.push(more)

  const moreHeaders: headerOption[] = [
    // {
    //   title: 'Benchmarks',
    //   slug: 'benchmarks',
    //   icon: Icons.BarChart4,
    // },
    // {
    //   title: 'Recomendações',
    //   slug: 'recommendations',
    //   icon: Icons.StarFilled,
    // },
    // {
    //   title: 'Awards',
    //   slug: 'awards',
    //   icon: Icons.Award,
    // },
  ]

  options.push(...moreHeaders)

  return options
}

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
