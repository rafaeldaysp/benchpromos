import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { getPages } from '@/lib/notion'
import { blogPageSchema } from '@/lib/validations/blog-page'
import { BlogFilters } from './blog-filters'
import { getBlogPageProperties } from '@/utils/notion'
import { type QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'

function getBlogCategories({ results }: QueryDatabaseResponse) {
  const categories: string[] = []
  results.forEach((pageData) => {
    const pageDetails = blogPageSchema.parse(pageData)
    const category = getBlogPageProperties(pageDetails).category

    if (!categories.includes(category)) {
      categories.push(category)
    }
  })
  return categories
}

interface BlogPageProps {
  searchParams: {
    [key: string]: string | undefined
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category } = searchParams
  const pagesResponse = await getPages()
  const categories = getBlogCategories(pagesResponse)

  const pagesParsed = pagesResponse.results.map((data) =>
    blogPageSchema.parse(data),
  )

  const filteredPages = pagesParsed.filter((page) =>
    page.properties.category.select.name.includes(category || ''),
  )

  return (
    <div className="my-10 px-4 sm:container">
      <main className="space-y-4">
        <BlogFilters categories={categories} initialCategory={category} />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => {
            const properties = getBlogPageProperties(page)

            return (
              <Link
                href={`/blog/${properties.slug}`}
                key={page.id}
                className="flex"
              >
                <Card className="flex flex-1 flex-col overflow-hidden transition-colors hover:bg-muted/50">
                  <CardHeader className="p-0 pb-6">
                    {properties.imageUrl && (
                      <div className="relative aspect-video sm:w-full">
                        <Image
                          src={properties.imageUrl}
                          alt={page.id}
                          className="object-contain"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                  </CardHeader>

                  <CardContent>
                    <h1 className="text-lg font-semibold">
                      {properties.title}
                    </h1>
                    <span></span>
                    <p className="text-sm text-muted-foreground">
                      {properties.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <div className="flex gap-2">
                      {properties.tags.map((tag) => (
                        <Badge key={tag.id}>{tag.name}</Badge>
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
