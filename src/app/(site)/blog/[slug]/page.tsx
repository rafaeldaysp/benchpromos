import { gql } from '@apollo/client'
import { type Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { NotionWrapper } from './notion-wrapper'

import { AdBanner } from '@/components/ad-banner'
import { ProductCard } from '@/components/product-card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UserAvatar } from '@/components/user-avatar'
import { siteConfig } from '@/config/site'
import { getClient } from '@/lib/apollo'
import { getPageBySlug, getRecordMap, getUser } from '@/lib/notion'
import { blogPageSchema } from '@/lib/validations/blog-page'
import {
  type Cashback,
  type Category,
  type Coupon,
  type Deal,
  type Product,
  type Retailer,
} from '@/types'
import { getBlogPageProperties } from '@/utils/notion'

interface PostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = params

  const page = await getPageBySlug(slug)

  if (!page)
    return {
      title: 'Não encontrado',
      description: 'Essa página não foi encontrada.',
    }
  const pageDetails = blogPageSchema.parse(page)
  const properties = getBlogPageProperties(pageDetails)

  const metadata: Metadata = {
    title: properties.title,
    description: `${properties.tags.join(' - ')} | ${properties.title}`,
    alternates: {
      canonical: `/blog/${properties.slug}`,
    },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      title: properties.title,
      description: `${properties.tags.map((tag) => tag.name).join(' - ')} | ${
        properties.title
      }`,
      url: siteConfig.url + `/blog/${properties.slug}`,
      images: [properties.imageUrl ?? ''],
      siteName: siteConfig.name,
    },
  }

  return metadata
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
          <h1 className="text-2xl font-bold">{properties.title}</h1>
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
          <div className="h-32 w-full rounded-xl border">
            <AdBanner
              dataAdFormat="auto"
              dataAdSlot="1544934153"
              dataFullWidthResponsive
            />
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
        {properties.productSlug && (
          <div className="flex w-full justify-center pb-4">
            <div className="max-w-xs">
              <ProductBlogCard slug={properties.productSlug} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const GET_PRODUCT_DEAL = gql`
  query GetProduct($productInput: GetProductInput!) {
    product(getProductInput: $productInput) {
      id
      name
      slug
      imageUrl
      category {
        slug
      }
      deals {
        id
        installments
        totalInstallmentPrice
        price
        url
        availability
        retailer {
          name
        }
        coupon {
          availability
          discount
          code
        }
        cashback {
          value
          provider
          video
          affiliatedUrl
        }
      }
    }
  }
`

async function ProductBlogCard({ slug }: { slug: string }) {
  const { data } = await getClient().query<{
    product: Product & {
      category: Category
      deals: (Deal & {
        retailer: Retailer
        coupon: Coupon
        cashback: Cashback
      })[]
    }
  }>({
    query: GET_PRODUCT_DEAL,
    errorPolicy: 'all',
    variables: {
      productInput: {
        identifier: slug,
        hasDeals: true,
      },
    },
  })
  if (!data?.product) return

  return <ProductCard product={data.product} />
}
