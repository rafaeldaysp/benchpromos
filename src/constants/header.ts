import { Icons } from '@/components/icons'
import { type Category, type headerOption } from '@/types'

interface HeaderOptionsProps {
  categories: Pick<Category, 'name' | 'slug'>[]
}

export function headerOptions({ categories }: HeaderOptionsProps) {
  const options: headerOption[] = [
    {
      title: 'Notebooks',
      slug: 'notebooks',
      icon: Icons.Laptop,
    },
    {
      title: 'Periféricos',
      icon: Icons.Headphones,
      content: [
        { title: 'Mouses', slug: 'mouses' },
        { title: 'Teclados', slug: 'teclados' },
        { title: 'Headsets', slug: 'headsets' },
        { title: 'Microfones', slug: 'microfones' },
        { title: 'Mousepads', slug: 'mousepads' },
        { title: 'Controles', slug: 'controles' },
      ],
    },
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
    title: 'Mais',
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
    {
      title: 'Blog',
      slug: 'blog',
      icon: Icons.NotebookPen,
    },
    {
      title: 'Benchmarks',
      slug: 'benchmarks',
      icon: Icons.BarChart4,
    },
    {
      title: 'Recomendações',
      slug: 'recommendations',
      icon: Icons.StarFilled,
    },
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
