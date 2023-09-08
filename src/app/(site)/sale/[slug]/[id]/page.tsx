import { gql } from '@apollo/client'
import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/app/_actions/user'
import { Comments } from '@/components/sales/comments'
import { getClient } from '@/lib/apollo'
import type { Sale } from '@/types'

const GET_SALE = gql`
  query Sale($saleId: ID!) {
    sale(id: $saleId) {
      id
      title
      commentsCount
    }
  }
`

interface SalePageProps {
  params: {
    slug: string
    id: string
  }
}

export default async function SalePage({ params }: SalePageProps) {
  const { slug, id } = params

  const user = await getCurrentUser()

  const { data, errors } = await getClient().query<{
    sale: Sale & { commentsCount: number }
  }>({
    query: GET_SALE,
    errorPolicy: 'all',
    variables: {
      saleId: id,
    },
  })

  if (errors) {
    return notFound()
  }

  const sale = data.sale

  return (
    <div className="space-y-10 px-4 py-10 sm:container">
      <div>
        <strong>{sale.title}</strong>
      </div>

      <Comments saleId={sale.id} user={user} count={sale.commentsCount} />
    </div>
  )
}
