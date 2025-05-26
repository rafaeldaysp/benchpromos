import { gql } from '@apollo/client'
import { type Metadata } from 'next'

import { siteConfig } from '@/config/site'
import { getClient } from '@/lib/apollo'
import { redirect } from 'next/navigation'
import NotFound from '../../not-found'

interface SalePageProps {
  params: {
    slug: string
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
  const { slug: id } = params

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
      url: siteConfig.url + `/sale/${[sale.slug]}/${sale.id}`,
      images: [sale.imageUrl],
      siteName: siteConfig.name,
    },
  }

  return metadata
}

export default async function SalePage({ params }: SalePageProps) {
  const { slug: id } = params

  if (!id) return NotFound()

  const GET_SALE = gql`
    query Sale($saleId: ID!) {
      sale(id: $saleId) {
        id
        slug
      }
    }
  `
  const { data } = await getClient().query<{
    sale: {
      id: string
      slug: string
    }
  }>({
    query: GET_SALE,
    variables: {
      saleId: id,
    },
  })

  const sale = data.sale

  if (!sale) return NotFound()

  return redirect(`/sale/${sale.slug}/${sale.id}`)
}
