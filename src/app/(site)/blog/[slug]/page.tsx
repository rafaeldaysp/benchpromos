import { notFound } from 'next/navigation'
import { NotionWrapper } from './notion-wrapper'

import { getPageBySlug, getRecordMap, getUser } from '@/lib/notion'
import { blogPageSchema } from '@/lib/validations/blog-page'
import { UserAvatar } from '@/components/user-avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { getBlogPageProperties } from '@/utils/notion'
import Image from 'next/image'

interface PostPageProps {
  params: {
    slug: string
  }
}
export default async function PostPage({ params: { slug } }: PostPageProps) {
  const page = await getPageBySlug(slug)

  if (!page) return notFound()

  const recordMap = await getRecordMap(page.id)
  const pageDetails = blogPageSchema.parse(page)
  const properties = getBlogPageProperties(pageDetails)

  const userId = pageDetails.properties.author.people[0].id

  const user = await getUser(userId)

  const createdAt = new Date(page.created_time)

  return (
    <div className="my-10 space-y-2 px-4 sm:container">
      <main className="rounded-xl bg-muted/50 p-2 sm:p-10">
        <div className="flex flex-col gap-4 p-4">
          <h1 className="text-2xl font-bold">
            {pageDetails.properties.title.title[0].plain_text}
          </h1>
          <span className="text-sm text-muted-foreground">
            {createdAt.toLocaleString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          {/* <Separator /> */}
          <div className="flex items-center gap-2">
            <UserAvatar
              user={{ image: user.avatar_url, name: user.name }}
              className="h-8 w-8"
            />
            <span className="font-semibold">{user.name}</span>
          </div>

          <div className="flex gap-2">
            {pageDetails.properties.tags.multi_select.map((tag) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}
          </div>
          <Separator />
          {properties.imageUrl && (
            <div className="relative aspect-video sm:w-full">
              <Image
                src={properties.imageUrl}
                alt={pageDetails.id}
                className="rounded-xl object-contain"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
        </div>

        <NotionWrapper recordMap={recordMap} />
      </main>
    </div>
  )
}
