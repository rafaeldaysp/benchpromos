import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import {
  type AwardsCategory,
  type AwardsCategoryOption,
  type AwardsCategoryOptionVote,
  type Product,
} from '@/types'
import { gql } from '@apollo/client'
import { AwardsDashboardMain } from './main'

const GET_AWARDS_CATEGORIES = gql`
  query GetAwardsCategories {
    awardsCategories {
      id
      title
      expiredAt
      description
      options {
        id
        title
        product {
          id
          imageUrl
          name
        }
        _count {
          votes
        }
        votes {
          id
          userId
          user {
            id
          }
        }
      }
    }
  }
`

export default async function AwardsDashboardPage() {
  const { data } = await getClient().query<{
    awardsCategories: (AwardsCategory & {
      options: (AwardsCategoryOption & {
        product: Product
        votes: AwardsCategoryOptionVote[]
      })[]
    })[]
  }>({
    query: GET_AWARDS_CATEGORIES,
  })

  const awardsCategories = data?.awardsCategories || []
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Awards</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de votações por categoria.
        </p>
      </div>
      <Separator />
      <AwardsDashboardMain awardsCategories={awardsCategories} />
    </div>
  )
}
