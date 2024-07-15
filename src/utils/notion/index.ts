import { type z } from 'zod'

import { type blogPageSchema } from '@/lib/validations/blog-page'

type BlogPage = z.infer<typeof blogPageSchema>

export function getBlogPageProperties(page: BlogPage) {
  const imageUrl =
    page.properties.thumbnail?.files[0]?.external?.url ||
    page.properties.thumbnail?.files[0]?.file?.url
  const title = page.properties.title.title
    .map((item) => item.plain_text)
    .join('')
  const description = page.properties.summary?.rich_text[0]?.plain_text ?? ''
  const slug = page.properties.slug?.rich_text[0]?.plain_text ?? ''
  const tags = page.properties.tags.multi_select
  const category = page.properties.category.select.name
  const productSlug = (
    page.properties.productSlug?.rich_text[0]?.plain_text ?? ''
  ).split(';')

  return {
    imageUrl,
    title,
    description,
    slug,
    tags,
    category,
    productSlug,
  }
}
