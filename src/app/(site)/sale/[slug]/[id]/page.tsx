import { gql } from '@apollo/client'
import { type Metadata } from 'next'

import { getCurrentUser } from '@/app/_actions/user'
import { siteConfig } from '@/config/site'
import { getClient } from '@/lib/apollo'
import { SaleMain } from './main'

interface SalePageProps {
  params: {
    slug: string
    id: string
  }
}

export async function generateMetadata({ params }: SalePageProps) {
  const GET_SALE_METADATA = gql`
    query Sale($saleId: ID!) {
      sale(id: $saleId) {
        id
        title
        imageUrl
        category {
          name
        }
        slug
      }
    }
  `
  const { id } = params

  const { data } = await getClient().query<{
    sale: {
      id: string
      title: string
      imageUrl: string
      slug: string
      category: {
        name: string
      }
    }
  }>({
    query: GET_SALE_METADATA,
    variables: {
      saleId: id,
    },
  })

  const sale = data.sale

  const metadata: Metadata = {
    title: sale.title,
    description: `${sale.category.name} | ${sale.title}`,
    alternates: {
      canonical: `/sale/${[sale.slug]}/${sale.id}`,
    },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      title: sale.title,
      description: `${sale.category.name} | ${sale.title}`,
      url: siteConfig.url + `/sale/${sale.slug}/${sale.id}`,
      images: [sale.imageUrl],
      siteName: siteConfig.name,
    },
  }

  return metadata
}

export default async function SalePage({ params }: SalePageProps) {
  const { id } = params

  const user = await getCurrentUser()

  return <SaleMain saleId={id} user={user} />
}
