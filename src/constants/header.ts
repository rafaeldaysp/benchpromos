import { gql } from '@apollo/client'

import { getClient } from '@/lib/apollo'
import { type Category } from '@/types'

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      name
      slug
    }
  }
`

export async function headerOptions() {
  const { data } = await getClient().query<{
    categories: Pick<Category, 'name' | 'slug'>[]
  }>({
    query: GET_CATEGORIES,
  })

  const categories = data?.categories

  const options: {
    title: string
    slug?: string
    content?: { title: string; slug: string }[]
  }[] = [
    {
      title: 'Notebooks',
      slug: 'notebooks',
    },
    {
      title: 'Periféricos',
      content: [
        { title: 'Mouses', slug: 'mouses' },
        { title: 'Teclados', slug: 'teclados' },
        { title: 'Headsets', slug: 'headsets' },
        { title: 'Microfones', slug: 'microfones' },
        { title: 'Mousepads', slug: 'mousepads' },
        { title: 'Controles', slug: 'controles' },
      ],
    },
    {
      title: 'Desktop',
      content: [
        { title: 'Computadores', slug: 'computadores' },
        { title: 'Placas de vídeo', slug: 'placas-de-video' },
        { title: 'Processadores', slug: 'processadores' },
        { title: 'Motherboards', slug: 'motherboards' },
        { title: 'Gabinetes', slug: 'gabinetes' },
        { title: 'Fontes', slug: 'fontes' },
      ],
    },
  ]
  const usedCategoriesSlug: string[] = options.flatMap(
    (option) => option.content?.map((item) => item.slug) ?? [option.slug!],
  )

  const othersCategories = categories.filter(
    (category) => !usedCategoriesSlug.includes(category.slug),
  )

  const more = {
    title: 'Mais',
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

  const benchmarks = {
    title: 'Benchmarks',
    slug: 'benchmarks',
  }

  options.push(benchmarks)

  return options
}
